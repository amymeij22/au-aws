"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { Admin } from "@/types/admin"
import { dummyAdmins } from "@/data/dummy-data"

interface AdminContextType {
  admins: Admin[]
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  addAdmin: (admin: Omit<Admin, "id">) => Promise<void>
  updateAdmin: (admin: Admin) => Promise<void>
  deleteAdmin: (id: string) => void
}

const AdminContext = createContext<AdminContextType | undefined>(undefined)

export function AdminProvider({ children }: { children: ReactNode }) {
  const [admins, setAdmins] = useState<Admin[]>([])
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Initialize with dummy data
  useEffect(() => {
    setAdmins(dummyAdmins)

    // Check if user is already logged in
    const authStatus = localStorage.getItem("isAuthenticated")
    if (authStatus === "true") {
      setIsAuthenticated(true)
    }

    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    // Simulate API call
    return new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        const admin = admins.find((a) => a.email === email && a.password === password)

        if (admin) {
          setIsAuthenticated(true)
          localStorage.setItem("isAuthenticated", "true")
          resolve()
        } else {
          reject(new Error("Invalid credentials"))
        }
      }, 500)
    })
  }

  const logout = () => {
    setIsAuthenticated(false)
    localStorage.removeItem("isAuthenticated")
  }

  const addAdmin = async (admin: Omit<Admin, "id">) => {
    // Simulate API call
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        const newAdmin: Admin = {
          ...admin,
          id: Math.random().toString(36).substring(2, 9),
        }

        setAdmins((prev) => [...prev, newAdmin])
        resolve()
      }, 500)
    })
  }

  const updateAdmin = async (admin: Admin) => {
    // Simulate API call
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        setAdmins((prev) => prev.map((a) => (a.id === admin.id ? admin : a)))
        resolve()
      }, 500)
    })
  }

  const deleteAdmin = (id: string) => {
    setAdmins((prev) => prev.filter((a) => a.id !== id))
  }

  return (
    <AdminContext.Provider
      value={{
        admins,
        isAuthenticated,
        isLoading,
        login,
        logout,
        addAdmin,
        updateAdmin,
        deleteAdmin,
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
