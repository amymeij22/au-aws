import mqtt from 'mqtt'
import type { MqttConfig, HiveMqPayload } from '@/types/mqtt'
import type { WeatherData } from '@/types/weather'

type MqttConnectionOptions = {
  onConnect: () => void
  onDisconnect: () => void
  onError: (error: Error) => void
  onMessage: (weatherData: WeatherData) => void
}

let client: mqtt.MqttClient | null = null
let isConnecting = false
let subscribedTopic: string | null = null
// Hashset untuk menyimpan Message IDs yang sudah diproses
const processedMessageIds = new Set<string>()
// Maksimum jumlah Message IDs yang disimpan
const MAX_PROCESSED_MESSAGES = 500
// Interval untuk keepalive check
let keepaliveInterval: NodeJS.Timeout | null = null

// Converts HiveMQ payload to our WeatherData format
export function parseMqttPayload(payload: HiveMqPayload): WeatherData {
  // Convert timestamp if it's a number (epoch time)
  let timestamp: string;
  if (typeof payload.timestamp === 'number') {
    // Convert epoch timestamp (seconds or milliseconds) to ISO string
    const epochTime = payload.timestamp;
    // Check if timestamp is in seconds (10 digits) or milliseconds (13 digits)
    const date = epochTime > 10000000000 
      ? new Date(epochTime) // already in milliseconds
      : new Date(epochTime * 1000); // convert seconds to milliseconds
    timestamp = date.toISOString();
  } else {
    timestamp = payload.timestamp;
  }

  return {
    timestamp: timestamp,
    temperature: Number(payload.Temp),
    humidity: Number(payload.Rh),
    pressure: Number(payload.pressure),
    radiation: Number(payload.radiation),
    windSpeed: Number(payload["wind.Speed"]),
    windDirection: Number(payload["wind.Direction"]),
    rainfall: Number(payload.precipitation)
  }
}

// Generate unique client ID that persists in localStorage
function getClientId(): string {
  // Coba mendapatkan ID dari localStorage
  const storageKey = 'mqtt_client_id'
  let clientId = typeof window !== 'undefined' ? localStorage.getItem(storageKey) : null
  
  // Jika tidak ada, buat baru dan simpan
  if (!clientId) {
    // Gabungkan random string dengan timestamp
    clientId = `aws_web_${Math.random().toString(16).substring(2, 8)}_${Date.now()}`
    
    // Simpan ke localStorage jika di browser
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, clientId)
    }
  }
  
  return clientId
}

// Track message yang sudah diproses untuk mencegah duplikasi
function isMessageProcessed(messageId: string): boolean {
  return processedMessageIds.has(messageId)
}

function addProcessedMessage(messageId: string): void {
  processedMessageIds.add(messageId)
  
  // Batasi ukuran set
  if (processedMessageIds.size > MAX_PROCESSED_MESSAGES) {
    // Hapus entry pertama (paling lama)
    const iterator = processedMessageIds.values()
    const firstKey = iterator.next().value
    if (firstKey) {
      processedMessageIds.delete(firstKey)
    }
  }
}

// Connect to MQTT broker
export function connectMqtt(config: MqttConfig, options: MqttConnectionOptions): void {
  // Prevent multiple connection attempts
  if (client || isConnecting) {
    disconnectMqtt()
  }

  isConnecting = true
  subscribedTopic = null

  try {
    // Convert regular MQTT URL to WebSocket URL with explicit protocol
    const wsProtocol = config.port === 8884 ? 'wss' : 'ws'
    const connectUrl = `${wsProtocol}://${config.url}:${config.port}/mqtt`
    
    // Connection options dengan QoS 0 (At most once) untuk performa lebih baik
    const mqttOptions: mqtt.IClientOptions = {
      clientId: getClientId(), // ID klien yang persisten
      clean: true,
      reconnectPeriod: 2000, // Try to reconnect every 2 seconds (lebih cepat)
      connectTimeout: 30000, // 30 seconds
      rejectUnauthorized: false, // Allow self-signed certificates
      keepalive: 15, // Keepalive 15 detik untuk deteksi putus koneksi lebih cepat
      protocolVersion: 4, // MQTT v3.1.1
      // WebSocket specific options
      wsOptions: {
        rejectUnauthorized: false,
      }
    }
    
    // Add credentials if provided
    if (config.username && config.password) {
      mqttOptions.username = config.username
      mqttOptions.password = config.password
    }

    // Create client
    client = mqtt.connect(connectUrl, mqttOptions)

    // Set up event handlers
    client.on('connect', () => {
      isConnecting = false
      
      // Subscribe to the topic with QoS 0 (At most once) untuk performa lebih baik
      if (client) {
        client.subscribe(config.topic, { qos: 0 }, (err, granted) => {
          if (err) {
            options.onError(new Error(`Failed to subscribe to topic: ${err.message}`))
          } else if (granted && granted.length > 0) {
            subscribedTopic = granted[0].topic
            options.onConnect()
          } else {
            options.onError(new Error('Failed to subscribe: Empty response'))
          }
        })
      }
      
      // Setup keepalive untuk menjaga koneksi tetap terhubung
      setupKeepalive(config, options)
    })

    client.on('message', (topic, message) => {
      try {
        // Gunakan topik dan timestamp sebagai ID pesan
        let messageId: string | null = null;
        
        // Parse the message (expected to be JSON)
        const rawMessage = message.toString()
        
        try {
          const rawPayload = JSON.parse(rawMessage) as HiveMqPayload
          
          // Gunakan timestamp sebagai ID pesan
          if (rawPayload.timestamp) {
            messageId = `${topic}-${rawPayload.timestamp}`
          }
          
          if (messageId && isMessageProcessed(messageId)) {
            // Message sudah diproses sebelumnya, abaikan
            return;
          }
          
          // Tambahkan ke daftar yang sudah diproses
          if (messageId) {
            addProcessedMessage(messageId);
          }
          
          if (typeof rawPayload.Temp === 'undefined' || 
              typeof rawPayload.Rh === 'undefined' || 
              typeof rawPayload.pressure === 'undefined' ||
              typeof rawPayload["wind.Direction"] === 'undefined' ||
              typeof rawPayload["wind.Speed"] === 'undefined' ||
              typeof rawPayload.radiation === 'undefined' ||
              typeof rawPayload.precipitation === 'undefined' ||
              typeof rawPayload.timestamp === 'undefined') {
            return
          }
          
          // Convert to our format
          const weatherData = parseMqttPayload(rawPayload)
          
          // Handle the data
          options.onMessage(weatherData)
        } catch (parseError) {
          // Error parsing silently handled
        }
      } catch (err) {
        options.onError(new Error(`Failed to parse MQTT message: ${err instanceof Error ? err.message : String(err)}`))
      }
    })

    client.on('error', (err) => {
      isConnecting = false
      options.onError(err)
      
      // Coba reconnect jika error fatal
      if (err.message.includes('Connection refused') || 
          err.message.includes('Unexpected close')) {
        setTimeout(() => {
          if (!client?.connected && !isConnecting) {
            connectMqtt(config, options)
          }
        }, 5000)
      }
    })

    client.on('close', () => {
      isConnecting = false
      subscribedTopic = null
      options.onDisconnect()
      
      // Coba reconnect secara otomatis
      setTimeout(() => {
        if (!client?.connected && !isConnecting) {
          connectMqtt(config, options)
        }
      }, 5000)
    })

    client.on('offline', () => {
      options.onDisconnect()
      
      // Coba reconnect secara otomatis
      setTimeout(() => {
        if (!client?.connected && !isConnecting) {
          connectMqtt(config, options)
        }
      }, 5000)
    })
  } catch (err) {
    isConnecting = false
    subscribedTopic = null
    options.onError(err instanceof Error ? err : new Error('Failed to set up MQTT connection'))
    
    // Coba reconnect secara otomatis
    setTimeout(() => {
      connectMqtt(config, options)
    }, 5000)
  }
}

// Setup keepalive mechanism untuk menjaga koneksi tetap aktif
function setupKeepalive(config: MqttConfig, options: MqttConnectionOptions): void {
  // Clear previous interval if exists
  if (keepaliveInterval) {
    clearInterval(keepaliveInterval)
  }
  
  // Interval untuk cek status koneksi dan kirim ping
  keepaliveInterval = setInterval(() => {
    if (client && client.connected) {
      // Kirim pesan ping untuk menjaga koneksi tetap aktif
      client.publish('$SYS/ping', 'ping', { qos: 0, retain: false })
    } else if (!isConnecting) {
      // Jika terputus tanpa proses reconnect, coba sambungkan kembali
      disconnectMqtt()
      connectMqtt(config, options)
    }
  }, 10000) // 10 detik interval
}

// Disconnect from MQTT broker
export function disconnectMqtt(): void {
  // Clear keepalive interval
  if (keepaliveInterval) {
    clearInterval(keepaliveInterval)
    keepaliveInterval = null
  }
  
  if (client) {
    try {
      if (subscribedTopic) {
        client.unsubscribe(subscribedTopic)
      }
      client.end(true)
    } catch (err) {
      // Silently handle disconnection errors
    } finally {
      client = null
      isConnecting = false
      subscribedTopic = null
    }
  }
}

// Check if connected to MQTT broker
export function isMqttConnected(): boolean {
  return client !== null && client.connected
}

// Check if subscribed to topic
export function isSubscribed(): boolean {
  return subscribedTopic !== null
} 