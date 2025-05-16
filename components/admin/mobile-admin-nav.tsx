"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { adminNavItems } from "@/lib/admin-nav-items"
import { useEffect, useState } from "react"

export default function MobileAdminNav() {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Only show on admin pages and on mobile
  if (!mounted || !pathname.startsWith("/admin")) return null

  return (
    <div className="md:hidden fixed bottom-0 left-0 z-50 w-full h-16 bg-background border-t flex items-center justify-around px-2">
      {adminNavItems.map((item) => {
        const isActive = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center w-full h-full text-xs",
              isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <div className={cn("h-6 w-6 mb-1 transition-colors", isActive && "text-primary")}>{item.icon}</div>
            <span className="truncate max-w-[64px] text-center">{item.title}</span>
          </Link>
        )
      })}
    </div>
  )
}
