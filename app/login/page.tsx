"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAdmin } from "@/context/admin-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, Eye, EyeOff } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import Image from "next/image"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loginError, setLoginError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const { login, isAuthenticated, isLoading: authLoading, error: contextError } = useAdmin()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && !authLoading && isAuthenticated) {
      router.push("/admin")
    }
  }, [mounted, authLoading, isAuthenticated, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError("")
    setIsSubmitting(true)

    try {
      await login({ username, password })
      router.push("/admin")
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : "Username atau password salah. Silakan coba lagi.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleShowPassword = () => {
    setShowPassword(!showPassword)
  }

  if (!mounted || authLoading || isAuthenticated) {
    return <LoginSkeleton />
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 relative">
      {/* Background Logo */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
        <div className="relative w-[80%] max-w-[500px] aspect-square opacity-[0.04] dark:opacity-[0.06]">
          <Image src="/images/tni-au-logo.png" alt="TNI AU Background" fill className="object-contain" priority />
        </div>
      </div>
      
      <Card className="mx-auto w-full max-w-sm sm:max-w-md relative z-10">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">Login Admin</CardTitle>
          <CardDescription>Masukkan username dan password untuk mengakses panel admin</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {(loginError || contextError) && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{loginError || contextError}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={toggleShowPassword}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  )}
                  <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
                </button>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Memproses..." : "Login"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

function LoginSkeleton() {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 relative">
      {/* Background Logo */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
        <div className="relative w-[80%] max-w-[500px] aspect-square opacity-[0.04] dark:opacity-[0.06]">
          <Image src="/images/tni-au-logo.png" alt="TNI AU Background" fill className="object-contain" priority />
        </div>
      </div>
      
      <Card className="mx-auto w-full max-w-sm sm:max-w-md relative z-10">
        <CardHeader className="space-y-1">
          <Skeleton className="h-8 w-[180px]" />
          <Skeleton className="h-4 w-[280px]" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-[60px]" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-[80px]" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
        <CardFooter>
          <Skeleton className="h-10 w-full" />
        </CardFooter>
      </Card>
    </div>
  )
}
