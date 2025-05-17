"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { MqttConfig } from "@/types/mqtt"
import { dummyMqttConfig } from "@/data/dummy-data"
import { useWeatherData } from "./weather-data-context"

interface MqttContextType {
  mqttConfig: MqttConfig | null
  isConnected: boolean
  updateMqttConfig: (config: MqttConfig) => void
}

const MqttContext = createContext<MqttContextType | undefined>(undefined)

export function MqttProvider({ children }: { children: ReactNode }) {
  const [mqttConfig, setMqttConfig] = useState<MqttConfig | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const { addWeatherData } = useWeatherData()

  // Initialize with dummy data
  useEffect(() => {
    setMqttConfig(dummyMqttConfig)
  }, [])

  // Simulate MQTT connection
  useEffect(() => {
    if (!mqttConfig || !mqttConfig.isActive) {
      setIsConnected(false)
      return
    }

    // Simulate connection
    const connectTimeout = setTimeout(() => {
      setIsConnected(true)
      console.log(`Connected to MQTT broker: ${mqttConfig.url}`)
      console.log(`Subscribed to topic: ${mqttConfig.topic}`)
    }, 1000)

    // Simulate receiving data
    const dataInterval = setInterval(() => {
      if (mqttConfig.isActive) {
        const now = new Date()

        // Generate random weather data
        const data = {
          station_id: "AWS001",
          timestamp: now.toISOString(),
          parameters: {
            temperature: 25 + Math.random() * 5,
            humidity: 60 + Math.random() * 20,
            pressure: 1010 + Math.random() * 10,
            radiation: 500 + Math.random() * 300,
            wind_speed: 2 + Math.random() * 5,
            wind_direction: Math.floor(Math.random() * 360),
            rainfall: Math.random() * 2,
          },
        }

        // Process the data
        addWeatherData({
          timestamp: data.timestamp,
          temperature: data.parameters.temperature,
          humidity: data.parameters.humidity,
          pressure: data.parameters.pressure,
          radiation: data.parameters.radiation,
          windSpeed: data.parameters.wind_speed,
          windDirection: data.parameters.wind_direction,
          rainfall: data.parameters.rainfall,
        })

        console.log("Received MQTT data:", data)
      }
    }, 10000) // Every 10 seconds

    return () => {
      clearTimeout(connectTimeout)
      clearInterval(dataInterval)
      setIsConnected(false)
    }
  }, [mqttConfig, addWeatherData])

  const updateMqttConfig = (config: MqttConfig) => {
    setMqttConfig(config)
  }

  return (
    <MqttContext.Provider
      value={{
        mqttConfig,
        isConnected,
        updateMqttConfig,
      }}
    >
      {children}
    </MqttContext.Provider>
  )
}

export function useMqtt() {
  const context = useContext(MqttContext)
  if (context === undefined) {
    throw new Error("useMqtt must be used within a MqttProvider")
  }
  return context
}
