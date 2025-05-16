"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useWeatherData } from "@/context/weather-data-context"
import { useMqtt } from "@/context/mqtt-context"
import { useAdmin } from "@/context/admin-context"
import { Skeleton } from "@/components/ui/skeleton"
import { useRouter } from "next/navigation"
import { Activity, CloudRain, Thermometer, Wind } from "lucide-react"
import TemperatureChart from "@/components/charts/temperature-chart"
import HumidityChart from "@/components/charts/humidity-chart"
import RadiationChart from "@/components/charts/radiation-chart"
import WindSpeedChart from "@/components/charts/wind-speed-chart"
import WindDirectionDistribution from "@/components/charts/wind-direction-distribution"
import RainfallChart from "@/components/charts/rainfall-chart"
import PressureChart from "@/components/charts/pressure-chart"

export default function AdminDashboard() {
  const { historicalData, stationMetadata } = useWeatherData()
  const { isConnected } = useMqtt()
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
    return <AdminDashboardSkeleton />
  }

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold md:text-3xl">Admin Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <Card className="shadow-sm">
          <CardHeader className="p-3 pb-1">
            <CardTitle className="text-sm font-medium">Status MQTT</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="flex items-center">
              <div className={`mr-2 h-3 w-3 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`}></div>
              <p className="text-base font-bold md:text-xl">{isConnected ? "Terhubung" : "Terputus"}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="p-3 pb-1">
            <CardTitle className="text-sm font-medium">Stasiun Aktif</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <p className="text-base font-bold md:text-xl">{stationMetadata ? 1 : 0}</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="p-3 pb-1">
            <CardTitle className="text-sm font-medium">Data Terkumpul</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <p className="text-base font-bold md:text-xl">{historicalData.length}</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="p-3 pb-1">
            <CardTitle className="text-sm font-medium">Periode Data</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <p className="text-base font-bold md:text-xl">24 Jam</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between p-3 pb-1">
            <CardTitle className="text-sm font-medium">Suhu Rata-rata</CardTitle>
            <Thermometer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <p className="text-base font-bold md:text-2xl">
              {historicalData.length > 0
                ? (historicalData.reduce((sum, item) => sum + item.temperature, 0) / historicalData.length).toFixed(1)
                : "--"}
              °C
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between p-3 pb-1">
            <CardTitle className="text-sm font-medium">Kelembapan Rata-rata</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <p className="text-base font-bold md:text-2xl">
              {historicalData.length > 0
                ? (historicalData.reduce((sum, item) => sum + item.humidity, 0) / historicalData.length).toFixed(1)
                : "--"}
              %
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between p-3 pb-1">
            <CardTitle className="text-sm font-medium">Kecepatan Angin Maks</CardTitle>
            <Wind className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <p className="text-base font-bold md:text-2xl">
              {historicalData.length > 0 ? Math.max(...historicalData.map((item) => item.windSpeed)).toFixed(1) : "--"}{" "}
              m/s
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between p-3 pb-1">
            <CardTitle className="text-sm font-medium">Total Curah Hujan</CardTitle>
            <CloudRain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <p className="text-base font-bold md:text-2xl">
              {historicalData.length > 0
                ? historicalData.reduce((sum, item) => sum + item.rainfall, 0).toFixed(1)
                : "--"}{" "}
              mm
            </p>
          </CardContent>
        </Card>
      </div>

      <h2 className="mb-3 text-xl font-bold">Grafik Parameter</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
        <Card className="shadow-sm">
          <CardHeader className="p-3 pb-1">
            <CardTitle className="text-sm font-medium">Suhu (°C)</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="h-[180px]">
              <TemperatureChart height={180} />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="p-3 pb-1">
            <CardTitle className="text-sm font-medium">Kelembapan (%)</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="h-[180px]">
              <HumidityChart height={180} />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="p-3 pb-1">
            <CardTitle className="text-sm font-medium">Tekanan Udara (hPa)</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="h-[180px]">
              <PressureChart height={180} />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="p-3 pb-1">
            <CardTitle className="text-sm font-medium">Radiasi Matahari (W/m²)</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="h-[180px]">
              <RadiationChart height={180} />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="p-3 pb-1">
            <CardTitle className="text-sm font-medium">Kecepatan Angin (m/s)</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="h-[180px]">
              <WindSpeedChart height={180} />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="p-3 pb-1">
            <CardTitle className="text-sm font-medium">Distribusi Arah Angin</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="h-[180px]">
              <WindDirectionDistribution height={180} />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm md:col-span-2 lg:col-span-3">
          <CardHeader className="p-3 pb-1">
            <CardTitle className="text-sm font-medium">Curah Hujan (mm/jam)</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="h-[180px]">
              <RainfallChart height={180} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function AdminDashboardSkeleton() {
  return (
    <div>
      <Skeleton className="mb-4 h-8 w-[200px] md:w-[250px]" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {Array(4)
          .fill(0)
          .map((_, i) => (
            <Card key={i} className="shadow-sm">
              <CardHeader className="p-3 pb-1">
                <Skeleton className="h-5 w-[100px]" />
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <Skeleton className="h-6 w-[80px]" />
              </CardContent>
            </Card>
          ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {Array(4)
          .fill(0)
          .map((_, i) => (
            <Card key={i} className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between p-3 pb-1">
                <Skeleton className="h-5 w-[100px]" />
                <Skeleton className="h-4 w-4 rounded-full" />
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <Skeleton className="h-6 w-[80px]" />
              </CardContent>
            </Card>
          ))}
      </div>

      <Skeleton className="mb-3 h-6 w-[150px]" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
        {Array(7)
          .fill(0)
          .map((_, i) => (
            <Card key={i} className={`shadow-sm ${i === 6 ? "md:col-span-2 lg:col-span-3" : ""}`}>
              <CardHeader className="p-3 pb-1">
                <Skeleton className="h-5 w-[120px]" />
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <Skeleton className="h-[180px] w-full rounded-md" />
              </CardContent>
            </Card>
          ))}
      </div>
    </div>
  )
}
