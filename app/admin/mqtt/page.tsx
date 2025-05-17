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
import { Eye, EyeOff, Settings } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

const mqttFormSchema = z.object({
  url: z.string().url({ message: "Masukkan URL WebSocket yang valid" }),
  topic: z.string().min(1, { message: "Topic tidak boleh kosong" }),
  username: z.string().min(1, { message: "Username tidak boleh kosong" }),
  password: z.string().min(1, { message: "Password tidak boleh kosong" }),
  isActive: z.boolean(),
})

type MqttFormValues = z.infer<typeof mqttFormSchema>

export default function MqttPage() {
  const { isAuthenticated, isLoading } = useAdmin()
  const { mqttConfig, updateMqttConfig, isConnected } = useMqtt()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isActive, setIsActive] = useState(false)

  const form = useForm<MqttFormValues>({
    resolver: zodResolver(mqttFormSchema),
    defaultValues: {
      url: mqttConfig?.url || "wss://5e3ab8b3f55c42c9be04a01b2e47662a.s1.eu.hivemq.cloud:8884/mqtt",
      topic: mqttConfig?.topic || "awsData",
      username: mqttConfig?.username || "kabagas",
      password: mqttConfig?.password || "@KabagasKeren082333",
      isActive: mqttConfig?.isActive || false,
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
        topic: mqttConfig.topic,
        username: mqttConfig.username,
        password: mqttConfig.password,
        isActive: mqttConfig.isActive,
      })
      setIsActive(mqttConfig.isActive)
    }
  }, [mqttConfig, form, mounted])

  const onSubmit = (data: MqttFormValues) => {
    updateMqttConfig(data)
    setDialogOpen(false)
    toast({
      title: "Konfigurasi MQTT diperbarui",
      description: "Perubahan konfigurasi MQTT telah disimpan.",
    })
  }

  const handleToggleActive = (active: boolean) => {
    if (mqttConfig) {
      setIsActive(active)
      const updatedConfig = { ...mqttConfig, isActive: active }
      updateMqttConfig(updatedConfig)
      form.setValue("isActive", active)
      toast({
        title: active ? "Koneksi MQTT diaktifkan" : "Koneksi MQTT dinonaktifkan",
        description: active
          ? "Sistem akan mulai menerima data dari broker MQTT."
          : "Sistem tidak akan menerima data dari broker MQTT.",
      })
    }
  }

  const openConfigDialog = () => {
    setDialogOpen(true)
  }

  if (!mounted || isLoading || !isAuthenticated) {
    return <MqttPageSkeleton />
  }

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold">Konfigurasi MQTT</h1>

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
                <p>Topic: {mqttConfig.topic}</p>
                <p>Username: {mqttConfig.username}</p>
                <p>Status: {mqttConfig.isActive ? "Aktif" : "Nonaktif"}</p>
              </div>
            )}
          </CardContent>
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
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Konfigurasi MQTT</DialogTitle>
            <DialogDescription>Atur konfigurasi koneksi MQTT untuk menerima data real-time.</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL WebSocket</FormLabel>
                    <FormControl>
                      <Input placeholder="wss://broker.hivemq.com:8884/mqtt" {...field} />
                    </FormControl>
                    <FormDescription>Masukkan URL WebSocket MQTT broker.</FormDescription>
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
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="username" {...field} />
                    </FormControl>
                    <FormDescription>Username untuk autentikasi MQTT.</FormDescription>
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
                        <Input type={showPassword ? "text" : "password"} placeholder="password" {...field} />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                          tabIndex={-1}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                          )}
                          <span className="sr-only">
                            {showPassword ? "Sembunyikan password" : "Tampilkan password"}
                          </span>
                        </Button>
                      </div>
                    </FormControl>
                    <FormDescription>Password untuk autentikasi MQTT.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Batal
                </Button>
                <Button type="submit">Simpan Konfigurasi</Button>
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
      <Skeleton className="mb-6 h-10 w-[200px] md:w-[250px]" />

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
            <div className="mt-4 space-y-2">
              <Skeleton className="h-4 w-[200px]" />
              <Skeleton className="h-4 w-[150px]" />
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-4 w-[100px]" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-[150px]" />
            <Skeleton className="h-4 w-[250px]" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Skeleton className="h-5 w-[100px]" />
                <Skeleton className="h-4 w-[200px]" />
              </div>
              <Skeleton className="h-6 w-12 rounded-full" />
            </div>
          </CardContent>
          <CardFooter>
            <Skeleton className="h-10 w-full rounded-md" />
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
