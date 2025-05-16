"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { WeatherData, StationMetadata } from "@/types/weather"
import { dummyHistoricalData, dummyStationMetadata } from "@/data/dummy-data"

interface WeatherDataContextType {
  currentData: WeatherData | null
  historicalData: WeatherData[]
  stationMetadata: StationMetadata | null
  lastUpdated: string | null
  addWeatherData: (data: WeatherData) => void
  clearHistoricalData: () => void
  addStationMetadata: (data: Omit<StationMetadata, "id">) => void
  updateStationMetadata: (data: StationMetadata) => void
  deleteStationMetadata: (id: string) => void
}

const WeatherDataContext = createContext<WeatherDataContextType | undefined>(undefined)

export function WeatherDataProvider({ children }: { children: ReactNode }) {
  const [currentData, setCurrentData] = useState<WeatherData | null>(null)
  const [historicalData, setHistoricalData] = useState<WeatherData[]>([])
  const [stationMetadata, setStationMetadata] = useState<StationMetadata | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  // Initialize with dummy data
  useEffect(() => {
    setHistoricalData(dummyHistoricalData)
    setStationMetadata(dummyStationMetadata)

    if (dummyHistoricalData.length > 0) {
      setCurrentData(dummyHistoricalData[dummyHistoricalData.length - 1])
      setLastUpdated(dummyHistoricalData[dummyHistoricalData.length - 1].timestamp)
    }
  }, [])

  const addWeatherData = (data: WeatherData) => {
    // Check for duplicates based on timestamp
    const isDuplicate = historicalData.some((item) => item.timestamp === data.timestamp)

    if (!isDuplicate) {
      setCurrentData(data)
      setHistoricalData((prev) => {
        // Keep only the last 24 hours of data
        const twentyFourHoursAgo = new Date()
        twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24)

        const filtered = prev.filter((item) => new Date(item.timestamp) >= twentyFourHoursAgo)

        return [...filtered, data].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      })
      setLastUpdated(data.timestamp)
    }
  }

  const clearHistoricalData = () => {
    setHistoricalData([])
    setCurrentData(null)
    setLastUpdated(null)
  }

  const addStationMetadata = (data: Omit<StationMetadata, "id">) => {
    const newStation: StationMetadata = {
      ...data,
      id: Math.random().toString(36).substring(2, 9),
    }
    setStationMetadata(newStation)
  }

  const updateStationMetadata = (data: StationMetadata) => {
    setStationMetadata(data)
  }

  const deleteStationMetadata = (id: string) => {
    if (stationMetadata?.id === id) {
      setStationMetadata(null)
    }
  }

  return (
    <WeatherDataContext.Provider
      value={{
        currentData,
        historicalData,
        stationMetadata,
        lastUpdated,
        addWeatherData,
        clearHistoricalData,
        addStationMetadata,
        updateStationMetadata,
        deleteStationMetadata,
      }}
    >
      {children}
    </WeatherDataContext.Provider>
  )
}

export function useWeatherData() {
  const context = useContext(WeatherDataContext)
  if (context === undefined) {
    throw new Error("useWeatherData must be used within a WeatherDataProvider")
  }
  return context
}
