import type React from "react"
import type { Metadata } from "next"
import AdminSidebar from "@/components/admin/admin-sidebar"
import MobileAdminNav from "@/components/admin/mobile-admin-nav"

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
      <div className="flex flex-1 relative">
        <AdminSidebar />
        <div className="flex-1 w-full transition-all duration-300 md:pl-64">
          <div className="p-4 md:p-6 min-h-[calc(100vh-4rem)] pb-20 md:pb-6">{children}</div>
        </div>
      </div>
      <MobileAdminNav />
    </div>
  )
}
