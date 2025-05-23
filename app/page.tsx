"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useWeatherData } from "@/context/weather-data-context"
import { formatDate } from "@/lib/utils"
import TemperatureChart from "@/components/charts/temperature-chart"
import HumidityChart from "@/components/charts/humidity-chart"
import RadiationChart from "@/components/charts/radiation-chart"
import WindCompass from "@/components/wind-compass"
import { Skeleton } from "@/components/ui/skeleton"
import Image from "next/image"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { supabase } from "@/lib/supabase"
import type { WeatherData } from "@/types/weather"

// Refresh interval dalam milliseconds (10 detik)
const AUTO_REFRESH_INTERVAL = 10000;

export default function Dashboard() {
  const { currentData, stationMetadata, lastUpdated, isLoading, error } = useWeatherData()
  const [mounted, setMounted] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  // Fungsi untuk mengambil data terbaru dari Supabase
  const fetchLatestData = useCallback(async () => {
    if (refreshing || !mounted) return;
    
    try {
      setRefreshing(true);
      
      // Ambil data terakhir dari database
      const { data, error: fetchError } = await supabase
        .from('weather_data')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(1)
        .single();
      
      if (fetchError) {
        console.error("Error fetching latest data:", fetchError);
        return;
      }
      
      if (data) {
        // Periksa apakah data yang diambil lebih baru dari yang ditampilkan
        const newTimestamp = new Date(data.timestamp).getTime();
        const currentTimestamp = lastUpdated ? new Date(lastUpdated).getTime() : 0;
        
        if (newTimestamp > currentTimestamp) {
          console.log("Dashboard: Memperbarui data dari database");
          
          // Format data ke format WeatherData
          const weatherData: WeatherData = {
            timestamp: data.timestamp,
            temperature: data.temperature,
            humidity: data.humidity,
            pressure: data.pressure,
            radiation: data.radiation,
            windSpeed: data.wind_speed,
            windDirection: data.wind_direction,
            rainfall: data.rainfall
          };
          
          // Update context dengan data terbaru
          // Note: Ini tidak mengubah data di konteks karena hanya membaca
          // Tapi setidaknya kita tahu ada data baru
          console.log("Data terbaru:", weatherData);
        }
      }
    } catch (err) {
      console.error("Error refreshing data:", err);
    } finally {
      setRefreshing(false);
    }
  }, [lastUpdated, mounted, refreshing]);

  // Aktifkan auto-refresh
  useEffect(() => {
    const interval = setInterval(() => {
      fetchLatestData();
    }, AUTO_REFRESH_INTERVAL);
    
    return () => clearInterval(interval);
  }, [fetchLatestData]);

  useEffect(() => {
    setMounted(true)
    
    // Ambil data pertama kali
    fetchLatestData();
    
    // Realtime subscription ke table weather_data
    const subscription = supabase
      .channel('weather_changes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'weather_data'
      }, () => {
        // Ada data baru, refresh manual
        fetchLatestData();
      })
      .subscribe();
      
    return () => {
      // Cleanup subscription
      subscription.unsubscribe();
    };
  }, [fetchLatestData])

  if (!mounted) {
    return <DashboardSkeleton />
  }

  if (isLoading) {
    return <DashboardSkeleton />
  }

  return (
    <div className="relative">
      {/* Background Logo */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
        <div className="relative w-[80%] max-w-[500px] aspect-square opacity-[0.04] dark:opacity-[0.06]">
          <Image src="/images/tni-au-logo.png" alt="TNI AU Background" fill className="object-contain" priority />
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto py-4 px-4 sm:px-6 relative z-10">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Automatic Weather Station Monitoring</h1>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-2 text-sm text-muted-foreground">
            <p>Stasiun: {stationMetadata?.name || "Loading..."}</p>
            <span className="hidden sm:inline">•</span>
            <p>No. WMO: {stationMetadata?.wmoNumber || "Loading..."}</p>
            <span className="hidden sm:inline">•</span>
            <p>
              Koordinat: {stationMetadata?.latitude || "0.00"}°, {stationMetadata?.longitude || "0.00"}°
            </p>
            <span className="hidden sm:inline">•</span>
            <p>Data Terakhir: {lastUpdated ? formatDate(lastUpdated) : "Menunggu data..."}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Left Column */}
          <div className="flex flex-col gap-4">
            {/* Temperature Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Suhu</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-4xl font-bold">{currentData?.temperature?.toFixed(1) || "--"}°C</p>
                </div>
                <div className="mt-4 h-[150px]">
                  <TemperatureChart />
                </div>
              </CardContent>
            </Card>

            {/* Solar Radiation Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Radiasi Matahari</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-4xl font-bold">
                    {currentData?.radiation?.toFixed(1) || "--"} <span className="text-xl">W/m²</span>
                  </p>
                </div>
                <div className="mt-4 h-[150px]">
                  <RadiationChart />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Middle Column */}
          <div className="flex flex-col gap-4 justify-between h-full">
            {/* Pressure Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Tekanan Udara</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex h-[100px] items-center justify-center">
                  <p className="text-5xl font-bold">
                    {currentData?.pressure?.toFixed(1) || "--"} <span className="text-2xl">hPa</span>
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Rainfall Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Curah Hujan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex h-[100px] items-center justify-center">
                  <p className="text-5xl font-bold">
                    {currentData?.rainfall?.toFixed(1) || "--"} <span className="text-2xl">mm/jam</span>
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Wind Speed Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Kecepatan Angin</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex h-[100px] items-center justify-center flex-col">
                  <p className="text-5xl font-bold">
                    {currentData?.windSpeed?.toFixed(1) || "--"} <span className="text-2xl">m/s</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="flex flex-col gap-4">
            {/* Humidity Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Kelembapan Relatif</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-4xl font-bold">{currentData?.humidity?.toFixed(1) || "--"}%</p>
                </div>
                <div className="mt-4 h-[150px]">
                  <HumidityChart />
                </div>
              </CardContent>
            </Card>

            {/* Wind Direction Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Arah Angin</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mt-4 h-[190px] flex items-center justify-center">
                  <WindCompass direction={currentData?.windDirection || 0} />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="relative">
      {/* Background Logo */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
        <div className="relative w-[80%] max-w-[800px] aspect-square opacity-[0.04] dark:opacity-[0.06]">
          <Image src="/images/tni-au-logo.png" alt="TNI AU Background" fill className="object-contain" priority />
        </div>
      </div>

      {/* Skeleton Content */}
      <div className="container mx-auto py-4 px-4 sm:px-6 relative z-10">
        <div className="mb-6 text-center">
          <Skeleton className="mx-auto h-10 w-[300px] md:w-[400px]" />
          <div className="mt-2 flex flex-wrap items-center justify-center gap-4">
            <Skeleton className="h-5 w-[150px]" />
            <Skeleton className="h-5 w-[100px]" />
            <Skeleton className="h-5 w-[200px]" />
            <Skeleton className="h-5 w-[180px]" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Left Column */}
          <div className="flex flex-col gap-4">
            {Array(2)
              .fill(0)
              .map((_, i) => (
                <Card key={`left-${i}`}>
                  <CardHeader className="pb-2">
                    <Skeleton className="h-6 w-[100px]" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <Skeleton className="mx-auto h-10 w-[100px]" />
                    </div>
                    <div className="mt-4 h-[150px]">
                      <Skeleton className="h-full w-full rounded-md" />
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>

          {/* Middle Column */}
          <div className="flex flex-col gap-4 justify-between h-full">
            {Array(3)
              .fill(0)
              .map((_, i) => (
                <Card key={`middle-${i}`}>
                  <CardHeader className="pb-2">
                    <Skeleton className="h-6 w-[100px]" />
                  </CardHeader>
                  <CardContent>
                    <div className="flex h-[100px] items-center justify-center">
                      <Skeleton className="h-10 w-[150px]" />
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>

          {/* Right Column */}
          <div className="flex flex-col gap-4">
            <Card>
              <CardHeader className="pb-2">
                <Skeleton className="h-6 w-[100px]" />
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <Skeleton className="mx-auto h-10 w-[100px]" />
                </div>
                <div className="mt-4 h-[150px]">
                  <Skeleton className="h-full w-full rounded-md" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <Skeleton className="h-6 w-[100px]" />
              </CardHeader>
              <CardContent>
                <div className="mt-4 h-[190px] flex items-center justify-center">
                  <Skeleton className="h-[160px] w-[160px] rounded-full" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
