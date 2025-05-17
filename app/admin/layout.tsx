"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useAdmin } from "@/context/admin-context"
import { useRouter } from "next/navigation"
import AdminSidebar from "@/components/admin/admin-sidebar"
import MobileAdminNav from "@/components/admin/mobile-admin-nav"
import Image from "next/image"
import { Skeleton } from "@/components/ui/skeleton"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isAuthenticated, isLoading } = useAdmin()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && !isLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [mounted, isLoading, isAuthenticated, router])

  if (!mounted || isLoading || !isAuthenticated) {
    return <AdminLayoutSkeleton />
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Background Logo */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
        <div className="relative w-[80%] max-w-[500px] aspect-square opacity-[0.04] dark:opacity-[0.06]">
          <Image src="/images/tni-au-logo.png" alt="TNI AU Background" fill className="object-contain" priority />
        </div>
      </div>
      
      <div className="flex flex-1 relative z-10">
        <AdminSidebar />
        <div className="flex-1 w-full transition-all duration-300 md:pl-64">
          <div className="p-4 md:p-6 min-h-[calc(100vh-4rem)] pb-20 md:pb-6">{children}</div>
        </div>
      </div>
      <MobileAdminNav />
    </div>
  )
}

function AdminLayoutSkeleton() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Background Logo */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
        <div className="relative w-[80%] max-w-[500px] aspect-square opacity-[0.04] dark:opacity-[0.06]">
          <Image src="/images/tni-au-logo.png" alt="TNI AU Background" fill className="object-contain" priority />
        </div>
      </div>
      
      <div className="flex flex-1 relative z-10">
        <div className="hidden md:block w-64 shrink-0 border-r min-h-screen">
          <div className="p-6">
            <Skeleton className="h-8 w-[150px] mb-8" />
            <div className="space-y-4">
              {Array(6)
                .fill(0)
                .map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
            </div>
          </div>
        </div>
        <div className="flex-1 w-full transition-all duration-300 md:pl-64">
          <div className="p-4 md:p-6 min-h-[calc(100vh-4rem)] pb-20 md:pb-6">
            <Skeleton className="h-10 w-[200px] mb-6" />
            <div className="grid gap-4">
              <Skeleton className="h-[200px] w-full rounded-lg" />
              <Skeleton className="h-[300px] w-full rounded-lg" />
            </div>
          </div>
        </div>
      </div>
      <div className="md:hidden fixed bottom-0 left-0 right-0 border-t bg-background z-10">
        <div className="flex items-center justify-around h-16">
          {Array(4)
            .fill(0)
            .map((_, i) => (
              <Skeleton key={i} className="h-10 w-10 rounded-md" />
            ))}
        </div>
      </div>
    </div>
  )
}
