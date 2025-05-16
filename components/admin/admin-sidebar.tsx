"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { LayoutDashboard } from "lucide-react"
import { adminNavItems } from "@/lib/admin-nav-items"

interface SidebarNavProps extends React.HTMLAttributes<HTMLElement> {}

export default function AdminSidebar({ className }: SidebarNavProps) {
  const pathname = usePathname()
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  // Hide sidebar on mobile - we'll use bottom navigation instead
  if (isMobile) {
    return null
  }

  // Desktop sidebar - always expanded
  return (
    <div className={cn("fixed top-16 left-0 z-30 h-[calc(100vh-4rem)] w-64 border-r bg-background", className)}>
      <div className="flex h-16 items-center border-b px-4">
        <Link href="/admin" className="flex items-center space-x-2">
          <LayoutDashboard className="h-6 w-6" />
          <span className="text-lg font-bold">Admin Panel</span>
        </Link>
      </div>
      <ScrollArea className="h-[calc(100vh-8rem)]">
        <div className="p-2">
          {adminNavItems.map((item) => (
            <Button
              key={item.href}
              variant={pathname === item.href ? "secondary" : "ghost"}
              className={cn(
                "mb-1 w-full justify-start",
                pathname === item.href ? "bg-secondary" : "hover:bg-transparent hover:underline",
              )}
              asChild
            >
              <Link href={item.href}>
                <div className="mr-2">{item.icon}</div>
                {item.title}
              </Link>
            </Button>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
