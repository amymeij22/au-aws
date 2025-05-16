"use client"

import type React from "react"

import { useState } from "react"
import { useAdmin } from "@/context/admin-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Admin } from "@/types/admin"
import { toast } from "@/components/ui/use-toast"

interface AdminFormProps {
  admin?: Admin
  onSuccess?: () => void
}

export default function AdminForm({ admin, onSuccess }: AdminFormProps) {
  const { addAdmin, updateAdmin } = useAdmin()
  const [name, setName] = useState(admin?.name || "")
  const [email, setEmail] = useState(admin?.email || "")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (admin) {
        // Update existing admin
        await updateAdmin({
          id: admin.id,
          name,
          email,
          password: password || undefined, // Only update password if provided
        })
        toast({
          title: "Admin diperbarui",
          description: "Data admin berhasil diperbarui.",
        })
      } else {
        // Add new admin
        await addAdmin({
          name,
          email,
          password,
        })
        toast({
          title: "Admin ditambahkan",
          description: "Admin baru berhasil ditambahkan.",
        })
      }

      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      toast({
        title: "Terjadi kesalahan",
        description: "Gagal menyimpan data admin.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nama Lengkap</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">{admin ? "Password (kosongkan jika tidak diubah)" : "Password"}</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required={!admin}
        />
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Menyimpan..." : admin ? "Perbarui Admin" : "Tambah Admin"}
      </Button>
    </form>
  )
}
