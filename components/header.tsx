"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import { Menu } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useAdmin } from "@/context/admin-context"
import { usePathname } from "next/navigation"
import Image from "next/image"

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const { isAuthenticated, logout } = useAdmin()
  const pathname = usePathname()
  const isAdminPage = pathname?.startsWith("/admin")

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <header
      className={`sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur transition-shadow ${
        isScrolled ? "shadow-md" : ""
      }`}
    >
      <div className="container flex h-16 items-center justify-between">
        {/* Left side - Logos */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* BMKG Logo */}
          <a href="https://www.bmkg.go.id" target="_blank" rel="noopener noreferrer">
            <div className="relative h-8 w-8 md:h-10 md:w-10">
              <Image
                src="https://www.bmkg.go.id/images/profil/logo-bmkg.png"
                alt="Logo BMKG"
                width={40}
                height={40}
                className="object-contain"
                crossOrigin="anonymous"
              />
            </div>
          </a>

          {/* TNI AU Logo */}
          <a href="https://tni-au.mil.id" target="_blank" rel="noopener noreferrer">
            <div className="relative h-8 w-8 md:h-10 md:w-10">
              <Image
                src="https://upload.wikimedia.org/wikipedia/commons/1/1c/Lambang_TNI_AU.png"
                alt="Logo TNI AU"
                width={40}
                height={40}
                className="object-contain"
                crossOrigin="anonymous"
              />
            </div>
          </a>

          {/* STMKG Logo */}
          <a href="https://stmkg.ac.id" target="_blank" rel="noopener noreferrer">
            <div className="relative h-8 w-8 md:h-10 md:w-10">
              <Image
                src="https://upload.wikimedia.org/wikipedia/id/c/ca/Stmkg-new.png"
                alt="Logo STMKG"
                width={45}
                height={45}
                className="object-contain"
                crossOrigin="anonymous"
              />
            </div>
          </a>
        </div>

        {/* Center - Navigation */}
        {isAuthenticated && (
          <nav className="hidden absolute left-1/2 transform -translate-x-1/2 md:flex gap-6">
            <Link
              href="/"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                pathname === "/" ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              Dashboard
            </Link>
            <Link
              href="/admin"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                isAdminPage ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              Admin Panel
            </Link>
          </nav>
        )}

        {/* Right side - Theme toggle and mobile menu */}
        <div className="flex items-center gap-2">
          <ModeToggle />
          {isAuthenticated && isAdminPage && (
            <Button variant="outline" onClick={logout} className="hidden md:flex">
              Logout
            </Button>
          )}
          {isAuthenticated && (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[85%] max-w-xs sm:max-w-sm">
                <nav className="flex flex-col gap-4 pt-10">
                  <Link href="/" className="text-lg font-medium transition-colors hover:text-primary">
                    Dashboard
                  </Link>
                  <Link href="/admin" className="text-lg font-medium transition-colors hover:text-primary">
                    Admin Panel
                  </Link>
                  <Button variant="outline" onClick={logout} className="mt-4">
                    Logout
                  </Button>
                </nav>
              </SheetContent>
            </Sheet>
          )}
        </div>
      </div>
    </header>
  )
}
