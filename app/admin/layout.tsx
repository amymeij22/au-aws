import type React from "react"
import type { Metadata } from "next"
import AdminSidebar from "@/components/admin/admin-sidebar"
import MobileAdminNav from "@/components/admin/mobile-admin-nav"
import Image from "next/image"

export const metadata: Metadata = {
  title: "Admin Panel - AWS Monitoring TNI AU",
  description: "Panel Admin untuk Monitoring Automatic Weather Station (AWS)",
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
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
