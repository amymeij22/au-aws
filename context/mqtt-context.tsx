"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { MqttConfig } from "@/types/mqtt"
import { useWeatherData } from "./weather-data-context"
import { supabase } from "@/lib/supabase"
import { connectMqtt, disconnectMqtt, isMqttConnected } from "@/lib/mqtt-client"

interface MqttContextType {
  mqttConfig: MqttConfig | null
  isConnected: boolean
  updateMqttConfig: (config: MqttConfig) => Promise<void>
  isLoading: boolean
  error: string | null
  reconnect: () => void
}

const MqttContext = createContext<MqttContextType | undefined>(undefined)

export function MqttProvider({ children }: { children: ReactNode }) {
  const [mqttConfig, setMqttConfig] = useState<MqttConfig | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { addWeatherData } = useWeatherData()

  // Fetch MQTT config from Supabase
  useEffect(() => {
    async function fetchMqttConfig() {
      try {
        const { data, error: fetchError } = await supabase
          .from('mqtt_config')
          .select('*')
          .limit(1)
          .single()

        if (fetchError) {
          // Set default HiveMQ config if fetch fails
          setMqttConfig({
            id: 'default',
            url: '5e3ab8b3f55c42c9be04a01b2e47662a.s1.eu.hivemq.cloud',
            port: 8884,
            topic: 'awsData',
            username: 'kabagas',
            password: '@KabagasKeren082333',
            isActive: true
          })
        } else if (data) {
          // Map Supabase data to our app format
          setMqttConfig({
            id: data.id,
            url: data.url,
            port: data.port,
            topic: data.topic,
            username: data.username || 'kabagas',
            password: data.password || '@KabagasKeren082333',
            isActive: data.is_active !== undefined ? data.is_active : true
          })
        } else {
          // If no configuration found, use default HiveMQ
          setMqttConfig({
            id: 'default',
            url: '5e3ab8b3f55c42c9be04a01b2e47662a.s1.eu.hivemq.cloud',
            port: 8884, 
            topic: 'awsData',
            username: 'kabagas',
            password: '@KabagasKeren082333',
            isActive: true
          })
        }
        
        setIsLoading(false)
        setError(null)
      } catch (err) {
        setError('Gagal memuat konfigurasi MQTT')
        // Set default HiveMQ config
        setMqttConfig({
          id: 'default',
          url: '5e3ab8b3f55c42c9be04a01b2e47662a.s1.eu.hivemq.cloud',
          port: 8884,
          topic: 'awsData',
          username: 'kabagas',
          password: '@KabagasKeren082333',
          isActive: true
        })
        setIsLoading(false)
      }
    }

    fetchMqttConfig()
  }, [])

  // Connect to MQTT broker when config changes
  useEffect(() => {
    if (!mqttConfig) {
      return;
    }
    
    if (!mqttConfig.isActive) {
      setIsConnected(false)
      disconnectMqtt();
      return;
    }

    // Connect to MQTT broker
    connectMqtt(mqttConfig, {
      onConnect: () => {
        setIsConnected(true)
        setError(null)
      },
      onDisconnect: () => {
        setIsConnected(false)
        // Only set error if it was previously connected (to avoid spamming errors on startup)
        if (isConnected) {
          setError('Koneksi MQTT terputus, coba sambung ulang')
        }
      },
      onError: (err) => {
        setError(`Error MQTT: ${err.message}`)
        setIsConnected(false)
      },
      onMessage: (weatherData) => {
        // Process the received weather data
        addWeatherData(weatherData)
      }
    })

    // Disconnect when component unmounts or config changes
    return () => {
      disconnectMqtt()
    }
  }, [mqttConfig, addWeatherData])

  // Check connection status periodically
  useEffect(() => {
    if (!mqttConfig || !mqttConfig.isActive) {
      return;
    }

    const checkInterval = setInterval(() => {
      const connectedStatus = isMqttConnected()
      if (connectedStatus !== isConnected) {
        setIsConnected(connectedStatus)
      }
    }, 5000)

    return () => {
      clearInterval(checkInterval)
    }
  }, [mqttConfig, isConnected])

  const updateMqttConfig = async (config: MqttConfig) => {
    try {
      setError(null)
      
      // Disconnect from current broker if connected
      disconnectMqtt()

      // If we have a valid ID (not 'default'), update in Supabase
      if (config.id && config.id !== 'default') {
        const { error: updateError } = await supabase
          .from('mqtt_config')
          .update({
            url: config.url,
            port: config.port,
            topic: config.topic,
            username: config.username || null,
            password: config.password || null,
            is_active: config.isActive
          })
          .eq('id', config.id)

        if (updateError) {
          // If update fails, try to insert a new record
          const { error: insertError } = await supabase
            .from('mqtt_config')
            .insert([{
              url: config.url,
              port: config.port,
              topic: config.topic,
              username: config.username || null,
              password: config.password || null,
              is_active: config.isActive
            }])
          
          if (insertError) {
            setError('Gagal memperbarui konfigurasi MQTT di database')
          }
        }
      } else {
        // If no ID or default ID, insert a new record
        const { error: insertError } = await supabase
          .from('mqtt_config')
          .insert([{
            url: config.url,
            port: config.port,
            topic: config.topic,
            username: config.username || null,
            password: config.password || null,
            is_active: config.isActive
          }])
        
        if (insertError) {
          setError('Gagal menyimpan konfigurasi MQTT baru')
        }
      }

      // Update local state
      setMqttConfig(config)

      // Reconnect if active
      if (config.isActive) {
        connectMqtt(config, {
          onConnect: () => {
            setIsConnected(true)
            setError(null)
          },
          onDisconnect: () => {
            setIsConnected(false)
          },
          onError: (err) => {
            setError(`Error MQTT: ${err.message}`)
            setIsConnected(false)
          },
          onMessage: (weatherData) => {
            addWeatherData(weatherData)
          }
        })
      }
    } catch (err) {
      setError('Gagal memperbarui konfigurasi MQTT')
    }
  }

  const reconnect = () => {
    if (mqttConfig) {
      setError(null)
      
      // Disconnect first
      disconnectMqtt()
      
      // Reconnect
      connectMqtt(mqttConfig, {
        onConnect: () => {
          setIsConnected(true)
          setError(null)
        },
        onDisconnect: () => {
          setIsConnected(false)
        },
        onError: (err) => {
          setError(`Error MQTT: ${err.message}`)
          setIsConnected(false)
        },
        onMessage: (weatherData) => {
          addWeatherData(weatherData)
        }
      })
    }
  }

  return (
    <MqttContext.Provider
      value={{
        mqttConfig,
        isConnected,
        updateMqttConfig,
        isLoading,
        error,
        reconnect
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
