"use client"

import { useEffect, useState } from "react"
import { useAdmin } from "@/context/admin-context"
import { useMqtt } from "@/context/mqtt-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { Skeleton } from "@/components/ui/skeleton"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { toast } from "@/components/ui/use-toast"

const mqttFormSchema = z.object({
  url: z.string().url({ message: "Masukkan URL WebSocket yang valid" }),
  topic: z.string().min(1, { message: "Topic tidak boleh kosong" }),
  isActive: z.boolean(),
})

type MqttFormValues = z.infer<typeof mqttFormSchema>

export default function MqttPage() {
  const { isAuthenticated, isLoading } = useAdmin()
  const { mqttConfig, updateMqttConfig, isConnected } = useMqtt()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  const form = useForm<MqttFormValues>({
    resolver: zodResolver(mqttFormSchema),
    defaultValues: {
      url: mqttConfig?.url || "",
      topic: mqttConfig?.topic || "",
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
        isActive: mqttConfig.isActive,
      })
    }
  }, [mqttConfig, form, mounted])

  const onSubmit = (data: MqttFormValues) => {
    updateMqttConfig(data)
    toast({
      title: "Konfigurasi MQTT diperbarui",
      description: "Perubahan konfigurasi MQTT telah disimpan.",
    })
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
              <div className="mt-4 text-sm text-muted-foreground">
                <p>URL: {mqttConfig.url}</p>
                <p>Topic: {mqttConfig.topic}</p>
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
                        <Input placeholder="aws/tniau/#" {...field} />
                      </FormControl>
                      <FormDescription>Topic MQTT untuk subscribe.</FormDescription>
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
                        <FormLabel>Status</FormLabel>
                        <FormDescription>Aktifkan atau nonaktifkan koneksi MQTT.</FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <Button type="submit">Simpan Konfigurasi</Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
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
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-[150px]" />
            <Skeleton className="h-4 w-[250px]" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-5 w-[100px]" />
                <Skeleton className="h-10 w-full rounded-md" />
                <Skeleton className="h-4 w-[200px]" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-5 w-[100px]" />
                <Skeleton className="h-10 w-full rounded-md" />
                <Skeleton className="h-4 w-[200px]" />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <Skeleton className="h-5 w-[100px]" />
                  <Skeleton className="h-4 w-[200px]" />
                </div>
                <Skeleton className="h-6 w-12 rounded-full" />
              </div>
              <Skeleton className="h-10 w-[150px] rounded-md" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
