"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, Wind, Clock, MapPin, X } from "lucide-react"
import { useWeatherData } from "@/context/weather-data-context"
import { formatDate } from "@/lib/utils"

interface WindAlertProps {
  isOpen: boolean
  onClose: () => void
  windSpeed: number
  timestamp?: string
}

export function WindAlert({ isOpen, onClose, windSpeed, timestamp }: WindAlertProps) {
  const { stationMetadata } = useWeatherData()
  
  const windSpeedKmh = windSpeed * 3.6
  const windSpeedKnot = windSpeed * 1.944

  const getWindSeverity = (speed: number) => {
    if (speed >= 20.8) return { 
      level: "Ekstrem", 
      bgClass: "bg-red-950", 
      textClass: "text-white",
      description: "Berbahaya - Hindari aktivitas luar ruangan",
      borderClass: "border-red-950"
    }
    if (speed >= 17.2) return { 
      level: "Sangat Kencang", 
      bgClass: "bg-red-900", 
      textClass: "text-white",
      description: "Sangat berbahaya untuk aktivitas luar ruangan",
      borderClass: "border-red-900"
    }
    if (speed >= 13.9) return { 
      level: "Kencang", 
      bgClass: "bg-red-800", 
      textClass: "text-white",
      description: "Berbahaya untuk aktivitas luar ruangan",
      borderClass: "border-red-800"
    }
    return { 
      level: "Waspada", 
      bgClass: "bg-red-700", 
      textClass: "text-white",
      description: "Berhati-hati dalam beraktivitas",
      borderClass: "border-red-700"
    }
  }

  const severity = getWindSeverity(windSpeed)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg bg-gradient-to-br from-red-50 via-red-50/80 to-red-100/60 dark:from-red-950/60 dark:via-red-950/50 dark:to-red-900/40 border-red-200 dark:border-red-800 shadow-2xl backdrop-blur-sm">
        <div className="absolute inset-0 bg-gradient-to-br from-red-900/5 to-red-800/10 rounded-lg pointer-events-none" />
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
        >
          <X className="h-4 w-4 text-red-700 dark:text-red-300" />
        </button>
        
        <DialogHeader className="relative">
          <div className="flex items-start gap-4 mb-3">
            <div className="p-3 bg-red-900 text-white rounded-full shadow-lg animate-pulse shrink-0">
              <AlertTriangle className="h-7 w-7" />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-xl font-bold text-red-900 dark:text-red-100 mb-3 leading-tight">
                ⚠️ Peringatan Angin Kencang
              </DialogTitle>
              <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-bold ${severity.bgClass} ${severity.textClass} shadow-md ${severity.borderClass} border-2`}>
                <Wind className="h-4 w-4 mr-1.5" />
                {severity.level}
              </div>
            </div>
          </div>
        </DialogHeader>
        
        <div className="relative space-y-5">
          {/* Wind Speed Display */}
          <div className="bg-white/90 dark:bg-red-950/50 p-5 rounded-xl border-2 border-red-200 dark:border-red-800 shadow-lg">
            <div className="flex items-center gap-2 mb-4">
              <Wind className="h-5 w-5 text-red-800 dark:text-red-300" />
              <h3 className="font-bold text-red-900 dark:text-red-100 text-lg">Kecepatan Angin Saat Ini</h3>
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-gradient-to-br from-red-100 to-red-150 dark:from-red-900/40 dark:to-red-900/30 rounded-xl shadow-md border border-red-200 dark:border-red-800">
                <p className="text-3xl font-black text-red-900 dark:text-red-200 mb-1">{windSpeed.toFixed(1)}</p>
                <p className="text-xs text-red-700 dark:text-red-300 font-semibold uppercase tracking-wide">m/s</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-red-100 to-red-150 dark:from-red-900/40 dark:to-red-900/30 rounded-xl shadow-md border border-red-200 dark:border-red-800">
                <p className="text-3xl font-black text-red-900 dark:text-red-200 mb-1">{windSpeedKmh.toFixed(1)}</p>
                <p className="text-xs text-red-700 dark:text-red-300 font-semibold uppercase tracking-wide">km/jam</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-red-100 to-red-150 dark:from-red-900/40 dark:to-red-900/30 rounded-xl shadow-md border border-red-200 dark:border-red-800">
                <p className="text-3xl font-black text-red-900 dark:text-red-200 mb-1">{windSpeedKnot.toFixed(1)}</p>
                <p className="text-xs text-red-700 dark:text-red-300 font-semibold uppercase tracking-wide">knot</p>
              </div>
            </div>
          </div>

          {/* Alert Message */}
          <Alert className="border-2 border-red-300 dark:border-red-700 bg-red-50/90 dark:bg-red-950/50 shadow-lg">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            <AlertDescription className="text-red-800 dark:text-red-200">
              <span className="font-bold block mb-2 text-base">{severity.description}</span>
              <span className="text-sm leading-relaxed">
                Kecepatan angin telah melampaui <strong>batas aman 22 knot (40 km/jam)</strong>. 
                Pertimbangkan untuk menunda aktivitas luar ruangan hingga kondisi membaik.
              </span>
            </AlertDescription>
          </Alert>

          {/* Station & Time Info */}
          <div className="bg-red-50/80 dark:bg-red-950/30 p-4 rounded-xl border border-red-200 dark:border-red-800">
            <div className="flex flex-col sm:flex-row gap-3 text-sm text-red-700 dark:text-red-300">
              {stationMetadata && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 shrink-0" />
                  <span className="font-semibold">{stationMetadata.name}</span>
                </div>
              )}
              {timestamp && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 shrink-0" />
                  <span className="font-medium">{formatDate(timestamp)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button 
              onClick={onClose}
              className="flex-1 bg-red-900 hover:bg-red-800 text-white border-0 shadow-lg px-6 py-3 font-semibold text-base rounded-xl transition-all duration-200 hover:shadow-xl"
            >
              Mengerti
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

interface WindAlertManagerProps {
  children: React.ReactNode
}

export function WindAlertManager({ children }: WindAlertManagerProps) {
  const { currentData, lastUpdated } = useWeatherData()
  const [isAlertOpen, setIsAlertOpen] = useState(false)
  const [hasShownAlert, setHasShownAlert] = useState(false)

  useEffect(() => {
    if (currentData?.windSpeed && currentData.windSpeed >= 11.18 && !hasShownAlert) {
      // Delay popup sedikit untuk memberikan efek yang lebih smooth
      const timer = setTimeout(() => {
        setIsAlertOpen(true)
        setHasShownAlert(true)
      }, 2000) // Increased delay untuk memberikan waktu loading
      
      return () => clearTimeout(timer)
    } else if (!currentData?.windSpeed || currentData.windSpeed < 11.18) {
      setHasShownAlert(false)
    }
  }, [currentData?.windSpeed, hasShownAlert])

  return (
    <>
      {children}
      {currentData?.windSpeed && (
        <WindAlert 
          isOpen={isAlertOpen}
          onClose={() => setIsAlertOpen(false)}
          windSpeed={currentData.windSpeed}
          timestamp={lastUpdated || undefined}
        />
      )}
    </>
  )
} 