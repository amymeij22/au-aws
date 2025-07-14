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
import { AlertCircle, AlertTriangle, Wind } from "lucide-react"
import { WindAlertManager } from "@/components/ui/wind-alert"
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
    <WindAlertManager>
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
            <div className="flex flex-col gap-4">
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
            <Card className={`transition-all duration-500 ${currentData?.windSpeed && currentData.windSpeed >= 11.18 
              ? 'ring-2 ring-red-900/50 bg-gradient-to-br from-red-50/60 to-red-100/40 dark:from-red-950/40 dark:to-red-900/30 shadow-lg shadow-red-200/50 dark:shadow-red-900/30 animate-pulse' 
              : ''}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Kecepatan Angin</CardTitle>
                    {currentData?.windSpeed && currentData.windSpeed >= 11.18 && (
                      <div className="flex items-center gap-1 px-3 py-1.5 bg-red-900 text-white rounded-full text-xs font-bold shadow-lg animate-bounce">
                        <AlertTriangle className="h-3 w-3" />
                        PERINGATAN
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex h-[100px] items-center justify-center flex-col">
                    <p className={`text-5xl font-bold transition-all duration-300 ${
                      currentData?.windSpeed && currentData.windSpeed >= 11.18 
                        ? 'text-red-900 dark:text-red-400 drop-shadow-lg' 
                        : ''
                    }`}>
                      {currentData?.windSpeed?.toFixed(1) || "--"} <span className="text-2xl">m/s</span>
                    </p>
                    {currentData?.windSpeed && currentData.windSpeed >= 11.18 && (
                      <div className="mt-2 text-center animate-pulse">
                        <p className="text-xs text-red-800 dark:text-red-300 font-semibold bg-red-100/80 dark:bg-red-900/30 px-2 py-1 rounded-full">
                          {(currentData.windSpeed * 3.6).toFixed(1)} km/jam | {(currentData.windSpeed * 1.944).toFixed(1)} knot
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {/* Wind Alert Warning */}
                  {currentData?.windSpeed && currentData.windSpeed >= 11.18 && (
                    <div className="mt-3 p-3 bg-gradient-to-r from-red-900/10 to-red-800/10 border-2 border-red-900/20 rounded-lg shadow-inner animate-pulse">
                      <div className="flex items-start gap-2">
                        <Wind className="h-4 w-4 text-red-900 dark:text-red-400 mt-0.5 flex-shrink-0 animate-spin" style={{animationDuration: '3s'}} />
                        <div className="text-sm">
                          <p className="font-bold text-red-900 dark:text-red-400 mb-1 flex items-center gap-1">
                            <span className="inline-block w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
                            Peringatan Angin Kencang!
                          </p>
                          <p className="text-red-800 dark:text-red-300 text-xs leading-relaxed">
                            Kecepatan angin telah mencapai <strong className="bg-red-200 dark:bg-red-900/50 px-1 rounded">{(currentData.windSpeed * 1.944).toFixed(1)} knot</strong>. 
                            Harap berhati-hati dan pertimbangkan untuk menunda aktivitas luar ruangan.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
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
    </WindAlertManager>
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
