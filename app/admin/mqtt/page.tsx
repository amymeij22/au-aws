"use client"

import { useEffect, useState } from "react"
import { useAdmin } from "@/context/admin-context"
import { useMqtt } from "@/context/mqtt-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { Skeleton } from "@/components/ui/skeleton"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { toast } from "@/components/ui/use-toast"
import { Eye, EyeOff, RefreshCw, Settings } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

const mqttFormSchema = z.object({
  url: z.string().min(1, { message: "URL tidak boleh kosong" }),
  port: z.coerce.number().int().min(1, { message: "Port harus berupa angka positif" }),
  topic: z.string().min(1, { message: "Topic tidak boleh kosong" }),
  username: z.string().min(1, { message: "Username tidak boleh kosong" }),
  password: z.string().min(1, { message: "Password tidak boleh kosong" }),
  isActive: z.boolean(),
})

type MqttFormValues = z.infer<typeof mqttFormSchema>

export default function MqttPage() {
  const { isAuthenticated, isLoading } = useAdmin()
  const { mqttConfig, updateMqttConfig, isConnected, error, reconnect } = useMqtt()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isActive, setIsActive] = useState(false)
  const [isReconnecting, setIsReconnecting] = useState(false)

  const form = useForm<MqttFormValues>({
    resolver: zodResolver(mqttFormSchema),
    defaultValues: {
      url: mqttConfig?.url || "5e3ab8b3f55c42c9be04a01b2e47662a.s1.eu.hivemq.cloud",
      port: mqttConfig?.port || 8884,
      topic: mqttConfig?.topic || "awsData",
      username: mqttConfig?.username || "kabagas",
      password: mqttConfig?.password || "@KabagasKeren082333",
      isActive: mqttConfig?.isActive || true,
    },
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && !isLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [mounted, isLoading, isAuthenticated, router])

  useEffect(() => {
    if (mqttConfig && mounted) {
      form.reset({
        url: mqttConfig.url,
        port: mqttConfig.port,
        topic: mqttConfig.topic,
        username: mqttConfig.username,
        password: mqttConfig.password,
        isActive: mqttConfig.isActive,
      })
      setIsActive(mqttConfig.isActive)
    }
  }, [mqttConfig, form, mounted])

  const onSubmit = async (data: MqttFormValues) => {
    if (mqttConfig) {
      try {
        await updateMqttConfig({
          ...mqttConfig,
          url: data.url,
          port: data.port,
          topic: data.topic,
          username: data.username || '',
          password: data.password || '',
          isActive: data.isActive,
        })
        setDialogOpen(false)
        toast({
          title: "Konfigurasi MQTT diperbarui",
          description: "Perubahan konfigurasi MQTT telah disimpan.",
        })
      } catch (err) {
        toast({
          title: "Gagal memperbarui konfigurasi",
          description: "Terjadi kesalahan saat menyimpan konfigurasi MQTT.",
          variant: "destructive",
        })
      }
    }
  }

  const handleToggleActive = async (active: boolean) => {
    if (mqttConfig) {
      setIsActive(active)
      try {
        await updateMqttConfig({
          ...mqttConfig,
          isActive: active,
        })
        form.setValue("isActive", active)
        toast({
          title: active ? "Koneksi MQTT diaktifkan" : "Koneksi MQTT dinonaktifkan",
          description: active
            ? "Sistem akan mulai menerima data dari broker MQTT."
            : "Sistem tidak akan menerima data dari broker MQTT.",
        })
      } catch (err) {
        toast({
          title: "Gagal mengubah status",
          description: "Terjadi kesalahan saat mengubah status koneksi MQTT.",
          variant: "destructive",
        })
      }
    }
  }

  const handleReconnect = () => {
    setIsReconnecting(true)
    reconnect()
    toast({
      title: "Mencoba menyambung ulang",
      description: "Mencoba menghubungkan kembali ke broker MQTT...",
    })
    
    // Reset reconnecting state after 2 seconds
    setTimeout(() => {
      setIsReconnecting(false)
    }, 2000)
  }

  const openConfigDialog = () => {
    setDialogOpen(true)
  }

  const toggleShowPassword = () => {
    setShowPassword(!showPassword)
  }

  if (!mounted || isLoading || !isAuthenticated) {
    return <MqttPageSkeleton />
  }

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold">Konfigurasi MQTT</h1>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Status Koneksi</CardTitle>
            <CardDescription>Status koneksi WebSocket MQTT saat ini.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className={`mr-2 h-4 w-4 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`}></div>
              <p className="text-lg font-medium">{isConnected ? "Terhubung" : "Terputus"}</p>
            </div>
            {mqttConfig && (
              <div className="mt-4 space-y-1 text-sm text-muted-foreground">
                <p>URL: {mqttConfig.url}</p>
                <p>Port: {mqttConfig.port}</p>
                <p>Topic: {mqttConfig.topic}</p>
                <p>Username: {mqttConfig.username ? mqttConfig.username : "-"}</p>
                <p>Status: {mqttConfig.isActive ? "Aktif" : "Nonaktif"}</p>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full" 
              onClick={handleReconnect} 
              disabled={!isActive || isReconnecting}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isReconnecting ? "animate-spin" : ""}`} />
              Sambung Ulang
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pengaturan MQTT</CardTitle>
            <CardDescription>Konfigurasi WebSocket MQTT untuk menerima data real-time.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-row items-center justify-between rounded-lg border p-3 mb-4">
              <div className="space-y-0.5">
                <Label>Status</Label>
                <p className="text-sm text-muted-foreground">Aktifkan atau nonaktifkan koneksi MQTT.</p>
              </div>
              <Switch checked={isActive} onCheckedChange={handleToggleActive} />
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" variant="outline" onClick={openConfigDialog}>
              <Settings className="mr-2 h-4 w-4" />
              Konfigurasi MQTT
            </Button>
          </CardFooter>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px] md:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Konfigurasi MQTT</DialogTitle>
            <DialogDescription>Atur konfigurasi koneksi MQTT untuk menerima data HiveMQ.</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL Broker</FormLabel>
                    <FormControl>
                      <Input placeholder="5e3ab8b3f55c42c9be04a01b2e47662a.s1.eu.hivemq.cloud" {...field} />
                    </FormControl>
                    <FormDescription>Masukkan URL broker MQTT (tanpa protokol).</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="port"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Port WebSocket</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="8884" {...field} />
                      </FormControl>
                      <FormDescription>Port WSS biasanya 8884.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="topic"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Topic</FormLabel>
                      <FormControl>
                        <Input placeholder="awsData" {...field} />
                      </FormControl>
                      <FormDescription>Topic MQTT untuk subscribe.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="kabagas" {...field} />
                    </FormControl>
                    <FormDescription>Username untuk otentikasi HiveMQ.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Masukkan password baru"
                          {...field}
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
                    </FormControl>
                    <FormDescription>Masukkan password baru untuk otentikasi HiveMQ.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Aktifkan Koneksi</FormLabel>
                      <FormDescription>Aktifkan atau nonaktifkan koneksi MQTT.</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <DialogFooter className="mt-6">
                <Button type="submit">Simpan Perubahan</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function MqttPageSkeleton() {
  return (
    <div>
      <Skeleton className="mb-6 h-10 w-[200px]" />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-[150px]" />
            <Skeleton className="h-4 w-[250px]" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Skeleton className="mr-2 h-4 w-4 rounded-full" />
              <Skeleton className="h-6 w-[100px]" />
            </div>
            <div className="mt-4 space-y-1">
              <Skeleton className="h-4 w-[200px]" />
              <Skeleton className="h-4 w-[150px]" />
              <Skeleton className="h-4 w-[175px]" />
              <Skeleton className="h-4 w-[125px]" />
            </div>
          </CardContent>
          <CardFooter>
            <Skeleton className="h-10 w-full" />
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-[150px]" />
            <Skeleton className="h-4 w-[250px]" />
          </CardHeader>
          <CardContent>
            <div className="flex flex-row items-center justify-between rounded-lg border p-3 mb-4">
              <div className="space-y-0.5">
                <Skeleton className="h-4 w-[50px]" />
                <Skeleton className="h-3 w-[200px]" />
              </div>
              <Skeleton className="h-6 w-12 rounded-full" />
            </div>
          </CardContent>
          <CardFooter>
            <Skeleton className="h-10 w-full" />
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
