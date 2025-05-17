"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { Admin, LoginCredentials } from "@/types/admin"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

interface AdminContextType {
  admins: Admin[]
  currentAdmin: Admin | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => void
  addAdmin: (admin: Omit<Admin, "id">) => Promise<void>
  updateAdmin: (admin: Admin) => Promise<void>
  deleteAdmin: (id: string) => Promise<void>
  refreshAdmins: () => Promise<void>
}

const AdminContext = createContext<AdminContextType | undefined>(undefined)

export function AdminProvider({ children }: { children: ReactNode }) {
  const [admins, setAdmins] = useState<Admin[]>([])
  const [currentAdmin, setCurrentAdmin] = useState<Admin | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Load admin data and check authentication
  useEffect(() => {
    const storedAdmin = localStorage.getItem("currentAdmin")
    if (storedAdmin) {
      try {
        const adminData = JSON.parse(storedAdmin) as Admin
        setCurrentAdmin(adminData)
        setIsAuthenticated(true)
      } catch (err) {
        console.error("Error parsing stored admin data:", err)
        localStorage.removeItem("currentAdmin")
      }
    }

    // Load admin list if authenticated
    if (isAuthenticated) {
      fetchAdmins()
    } else {
      setIsLoading(false)
    }
  }, [isAuthenticated])

  const fetchAdmins = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('admins')
        .select('id, username, full_name, role, last_login')
        .order('username', { ascending: true })

      if (fetchError) {
        console.error('Error fetching admins:', fetchError)
        setError('Gagal memuat data admin')
        // Gunakan array kosong jika terjadi error
        setAdmins([])
      } else if (data) {
        // Transform to our application model
        const transformedAdmins: Admin[] = data.map(admin => ({
          id: admin.id,
          username: admin.username,
          fullName: admin.full_name,
          role: 'admin', // Memastikan hanya admin yang ada
          lastLogin: admin.last_login || undefined
        }))
        setAdmins(transformedAdmins)
        setError(null)
      }
    } catch (err) {
      console.error('Unexpected error:', err)
      setError('Gagal memuat data admin')
      setAdmins([])
    } finally {
      setIsLoading(false)
    }
  }

  const refreshAdmins = async () => {
    await fetchAdmins()
  }

  const login = async ({ username, password }: LoginCredentials) => {
    try {
      setIsLoading(true)
      setError(null)

      const { data, error: loginError } = await supabase
        .rpc('check_admin_password', {
          p_username: username,
          p_password: password
        })

      if (loginError) {
        console.error('Login error:', loginError)
        throw new Error('Login gagal')
      }

      if (data && data.length > 0) {
        const adminData: Admin = {
          id: data[0].id,
          username: data[0].username,
          fullName: data[0].full_name,
          role: 'admin',
        }

        setCurrentAdmin(adminData)
        setIsAuthenticated(true)
        localStorage.setItem('currentAdmin', JSON.stringify(adminData))

        // Load admin list
        await fetchAdmins()
        return
      }

      throw new Error('Username atau password salah')
    } catch (err) {
      console.error('Login failed:', err)
      setError(err instanceof Error ? err.message : 'Login gagal')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    setCurrentAdmin(null)
    setIsAuthenticated(false)
    localStorage.removeItem('currentAdmin')
    router.push('/login')
  }

  const addAdmin = async (admin: Omit<Admin, "id">) => {
    try {
      setIsLoading(true)
      setError(null)

      // Password akan di-hash secara otomatis oleh trigger database
      const { data, error: addError } = await supabase
        .from('admins')
        .insert([
          {
            username: admin.username,
            password: admin.password || 'password123', // Password otomatis dihash oleh trigger
            full_name: admin.fullName,
            role: 'admin' // Memastikan role selalu admin
          }
        ])
        .select()
        .single()

      if (addError) {
        console.error('Error adding admin:', addError)
        throw new Error('Gagal menambahkan admin')
      }

      await refreshAdmins()
      return
    } catch (err) {
      console.error('Error adding admin:', err)
      setError(err instanceof Error ? err.message : 'Gagal menambahkan admin')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const updateAdmin = async (admin: Admin) => {
    try {
      setIsLoading(true)
      setError(null)

      const updateData: any = {
        username: admin.username,
        full_name: admin.fullName,
        role: 'admin' // Memastikan role selalu admin
      }

      // Hanya sertakan password jika disediakan (untuk update)
      // Password akan di-hash secara otomatis oleh trigger database
      if (admin.password) {
        updateData.password = admin.password
      }

      const { error: updateError } = await supabase
        .from('admins')
        .update(updateData)
        .eq('id', admin.id)

      if (updateError) {
        console.error('Error updating admin:', updateError)
        throw new Error('Gagal memperbarui admin')
      }

      // If the updated admin is the current user, update the current admin state
      if (currentAdmin && currentAdmin.id === admin.id) {
        const updatedAdmin: Admin = { 
          id: currentAdmin.id,
          username: admin.username,
          fullName: admin.fullName,
          role: 'admin',
          lastLogin: currentAdmin.lastLogin
          // Tidak menyimpan password di client
        }
        setCurrentAdmin(updatedAdmin)
        localStorage.setItem('currentAdmin', JSON.stringify(updatedAdmin))
      }

      await refreshAdmins()
      return
    } catch (err) {
      console.error('Error updating admin:', err)
      setError(err instanceof Error ? err.message : 'Gagal memperbarui admin')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const deleteAdmin = async (id: string) => {
    try {
      // Don't allow deleting your own account
      if (currentAdmin && currentAdmin.id === id) {
        throw new Error('Anda tidak dapat menghapus akun Anda sendiri')
      }

      setIsLoading(true)
      setError(null)

      const { error: deleteError } = await supabase
        .from('admins')
        .delete()
        .eq('id', id)

      if (deleteError) {
        console.error('Error deleting admin:', deleteError)
        throw new Error('Gagal menghapus admin')
      }

      await refreshAdmins()
      return
    } catch (err) {
      console.error('Error deleting admin:', err)
      setError(err instanceof Error ? err.message : 'Gagal menghapus admin')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AdminContext.Provider
      value={{
        admins,
        currentAdmin,
        isAuthenticated,
        isLoading,
        error,
        login,
        logout,
        addAdmin,
        updateAdmin,
        deleteAdmin,
        refreshAdmins
      }}
    >
      {children}
    </AdminContext.Provider>
  )
}

export function useAdmin() {
  const context = useContext(AdminContext)
  if (context === undefined) {
    throw new Error("useAdmin must be used within an AdminProvider")
  }
  return context
}
