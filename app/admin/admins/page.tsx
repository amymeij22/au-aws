"use client"

import { useEffect, useState } from "react"
import { useAdmin } from "@/context/admin-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Pencil, Plus, Trash2, RefreshCw, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDate } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { Admin } from "@/types/admin"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"

// Form schema
const adminFormSchema = z.object({
  username: z.string().min(3, "Username harus minimal 3 karakter"),
  fullName: z.string().min(3, "Nama lengkap harus minimal 3 karakter"),
  password: z.string().optional(),
})

type AdminFormValues = z.infer<typeof adminFormSchema>

export default function AdminsPage() {
  const { 
    currentAdmin, 
    isAuthenticated, 
    isLoading, 
    admins, 
    addAdmin, 
    updateAdmin, 
    deleteAdmin, 
    refreshAdmins,
    error: contextError 
  } = useAdmin()
  
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [adminToDelete, setAdminToDelete] = useState<Admin | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && !isLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [mounted, isLoading, isAuthenticated, router])

  const handleEdit = (admin: Admin) => {
    setSelectedAdmin(admin)
    setIsEditDialogOpen(true)
  }

  const handleDelete = (admin: Admin) => {
    setAdminToDelete(admin)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (adminToDelete) {
      try {
        setLocalError(null)
        await deleteAdmin(adminToDelete.id)
        setIsDeleteDialogOpen(false)
        setAdminToDelete(null)
      } catch (err) {
        setLocalError(err instanceof Error ? err.message : "Gagal menghapus admin")
      }
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    setLocalError(null)
    try {
      await refreshAdmins()
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Gagal memuat data admin")
    } finally {
      setIsRefreshing(false)
    }
  }

  if (!mounted || isLoading || !isAuthenticated) {
    return <AdminsPageSkeleton />
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Pengelolaan Admin</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Tambah Admin
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tambah Admin Baru</DialogTitle>
                <DialogDescription>Isi form berikut untuk menambahkan admin baru.</DialogDescription>
              </DialogHeader>
              <AdminForm onSuccess={() => setIsAddDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {(contextError || localError) && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{contextError || localError}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Daftar Admin</CardTitle>
          <CardDescription>Kelola akun admin yang memiliki akses ke sistem.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Nama Lengkap</TableHead>
                <TableHead>Login Terakhir</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {admins.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    Tidak ada data admin
                  </TableCell>
                </TableRow>
              ) : (
                admins.map((admin) => (
                  <TableRow key={admin.id}>
                    <TableCell>{admin.username}</TableCell>
                    <TableCell>{admin.fullName}</TableCell>
                    <TableCell>{admin.lastLogin ? formatDate(admin.lastLogin) : 'Belum Pernah'}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(admin)}>
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDelete(admin)}
                        disabled={currentAdmin?.id === admin.id} // Jangan biarkan user menghapus akun sendiri
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Admin</DialogTitle>
            <DialogDescription>Ubah informasi admin.</DialogDescription>
          </DialogHeader>
          {selectedAdmin && (
            <AdminForm
              admin={selectedAdmin}
              onSuccess={() => {
                setIsEditDialogOpen(false)
                setSelectedAdmin(null)
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Hapus</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus admin {adminToDelete?.fullName}? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// Component AdminForm
function AdminForm({ admin, onSuccess }: { admin?: Admin; onSuccess: () => void }) {
  const { addAdmin, updateAdmin } = useAdmin()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Set default values
  const defaultValues: Partial<AdminFormValues> = {
    username: admin?.username || "",
    fullName: admin?.fullName || "",
    password: "",
  }

  const form = useForm<AdminFormValues>({
    resolver: zodResolver(adminFormSchema),
    defaultValues,
  })

  const onSubmit = async (values: AdminFormValues) => {
    setIsSubmitting(true)
    setFormError(null)

    try {
      if (admin) {
        // Update existing admin
        await updateAdmin({
          ...admin,
          username: values.username,
          fullName: values.fullName,
          password: values.password,
        })
      } else {
        // Add new admin
        await addAdmin({
          username: values.username,
          fullName: values.fullName,
          role: 'admin',
          password: values.password || "password123", // Default password if not provided
        })
      }
      onSuccess()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Terjadi kesalahan saat menyimpan data")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      {formError && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nama Lengkap</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{admin ? "Password Baru (Kosongkan jika tidak diubah)" : "Password"}</FormLabel>
              <FormControl>
                <Input type="password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Menyimpan..." : admin ? "Perbarui" : "Tambah"}
          </Button>
        </div>
      </form>
    </Form>
  )
}

function AdminsPageSkeleton() {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <Skeleton className="h-10 w-[200px] md:w-[250px]" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-[100px]" />
          <Skeleton className="h-10 w-[150px]" />
        </div>
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-[150px]" />
          <Skeleton className="h-4 w-[250px]" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <Skeleton className="h-5 w-[100px]" />
              <Skeleton className="h-5 w-[100px]" />
              <Skeleton className="h-5 w-[100px]" />
              <Skeleton className="h-5 w-[100px]" />
            </div>
            {Array(3)
              .fill(0)
              .map((_, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b">
                  <Skeleton className="h-5 w-[100px]" />
                  <Skeleton className="h-5 w-[150px]" />
                  <Skeleton className="h-5 w-[150px]" />
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-8 rounded-md" />
                    <Skeleton className="h-8 w-8 rounded-md" />
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
