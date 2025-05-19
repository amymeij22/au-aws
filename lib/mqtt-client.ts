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
// Interval untuk reconnect check
let reconnectInterval: NodeJS.Timeout | null = null
// Flag untuk mengidentifikasi jika koneksi sengaja diputus
let intentionalDisconnect = false
// Maksimum percobaan koneksi
const MAX_CONNECT_ATTEMPTS = 10
// Penghitung percobaan koneksi
let connectAttempts = 0

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
    const firstKey = processedMessageIds.values().next().value
    processedMessageIds.delete(firstKey)
  }
}

// Fungsi untuk menangani proses subscribe
function subscribeToTopic(config: MqttConfig, options: MqttConnectionOptions): void {
  if (!client || !client.connected) return;
  
  console.log('Mencoba subscribe ke topic:', config.topic);
  
  // Subscribe to the topic with QoS 0 (At most once) untuk performa lebih baik
  client.subscribe(config.topic, { qos: 0 }, (err, granted) => {
    if (err) {
      console.error('Gagal subscribe ke topic:', err.message);
      options.onError(new Error(`Failed to subscribe to topic: ${err.message}`));
    } else if (granted && granted.length > 0) {
      subscribedTopic = granted[0].topic;
      console.log('Berhasil subscribe ke topic:', subscribedTopic);
      options.onConnect();
    } else {
      console.error('Gagal subscribe: Empty response');
      options.onError(new Error('Failed to subscribe: Empty response'));
    }
  });
}

// Connect to MQTT broker
export function connectMqtt(config: MqttConfig, options: MqttConnectionOptions): void {
  // Reset reconnect state
  connectAttempts = 0;
  intentionalDisconnect = false;
  
  // Prevent multiple connection attempts
  if (client) {
    disconnectMqtt();
  }

  isConnecting = true;
  subscribedTopic = null;

  try {
    // Convert regular MQTT URL to WebSocket URL with explicit protocol
    const wsProtocol = config.port === 8884 ? 'wss' : 'ws';
    const connectUrl = `${wsProtocol}://${config.url}:${config.port}/mqtt`;
    
    console.log('Mencoba koneksi ke MQTT broker:', connectUrl);
    
    // Connection options dengan QoS 0 (At most once) untuk performa lebih baik
    const mqttOptions: mqtt.IClientOptions = {
      clientId: getClientId(), // ID klien yang persisten
      clean: true,
      reconnectPeriod: 2000, // Try to reconnect every 2 seconds (more aggressive)
      connectTimeout: 30000, // 30 seconds
      rejectUnauthorized: false, // Allow self-signed certificates
      keepalive: 15, // Keepalive 15 detik untuk deteksi putus koneksi lebih cepat
      protocolVersion: 4, // MQTT v3.1.1
      // WebSocket specific options
      wsOptions: {
        rejectUnauthorized: false,
        headers: {
          'User-Agent': 'Mozilla/5.0'
        }
      }
    };
    
    // Add credentials if provided
    if (typeof config.username === 'string' && typeof config.password === 'string') {
      mqttOptions.username = config.username;
      mqttOptions.password = config.password;
    }

    // Create client
    client = mqtt.connect(connectUrl, mqttOptions);

    // Set up event handlers
    client.on('connect', () => {
      console.log('Koneksi MQTT berhasil');
      isConnecting = false;
      connectAttempts = 0; // Reset penghitung percobaan koneksi
      subscribeToTopic(config, options);
      
      // Setup custom ping mekanisme untuk menjaga koneksi
      setupPingMechanism(config, options);
    });

    client.on('reconnect', () => {
      console.log('Mencoba reconnect ke MQTT broker...');
      isConnecting = true;
      
      // Jika sudah melebihi batas percobaan, buat koneksi baru
      connectAttempts++;
      if (connectAttempts > MAX_CONNECT_ATTEMPTS) {
        console.log('Percobaan reconnect melebihi batas, memulai koneksi ulang...');
        disconnectMqtt();
        setTimeout(() => {
          connectMqtt(config, options);
        }, 1000);
      }
    });

    client.on('message', (topic, message, packet) => {
      try {
        // Gunakan packet.messageId sebagai string untuk identifikasi pesan
        let messageId: string | null = null;
        
        if (packet && typeof packet.messageId === 'number') {
          // Gunakan string 'message' sebagai fallback jika cmd adalah undefined
          const cmd = typeof packet.cmd === 'string' ? packet.cmd : 'message';
          messageId = `${packet.messageId}-${cmd}`;
        }
        
        if (messageId && isMessageProcessed(messageId)) {
          // Message sudah diproses sebelumnya, abaikan
          return;
        }
        
        // Tambahkan ke daftar yang sudah diproses
        if (messageId) {
          addProcessedMessage(messageId);
        }
        
        // Parse the message (expected to be JSON)
        const rawMessage = message.toString()
        
        try {
          const rawPayload = JSON.parse(rawMessage) as HiveMqPayload
          
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
          console.warn('Error parsing MQTT message JSON:', parseError);
          // Tidak perlu throw error, cukup log saja
        }
      } catch (err) {
        console.error('Unexpected error in message handler:', err);
        options.onError(new Error(`Failed to parse MQTT message: ${err instanceof Error ? err.message : String(err)}`))
      }
    });

    client.on('error', (err) => {
      console.error('Error koneksi MQTT:', err.message);
      isConnecting = false;
      options.onError(err);
      
      // Jika error fatal, coba buat koneksi baru
      if (err.message.includes('Connection refused') || 
          err.message.includes('Client disconnecting') ||
          err.message.includes('Unexpected close')) {
        disconnectMqtt();
        setTimeout(() => {
          connectMqtt(config, options);
        }, 5000);
      }
    });

    client.on('close', () => {
      console.log('Koneksi MQTT tertutup');
      isConnecting = false;
      subscribedTopic = null;
      
      if (!intentionalDisconnect) {
        options.onDisconnect();
        
        // Coba reconnect secara manual jika tidak sengaja diputus
        setTimeout(() => {
          if (!client?.connected && !isConnecting && !intentionalDisconnect) {
            console.log('Mencoba koneksi ulang setelah close...');
            connectMqtt(config, options);
          }
        }, 5000);
      }
    });

    client.on('offline', () => {
      console.log('MQTT client offline');
      options.onDisconnect();
      
      // Jika tidak sengaja offline, coba reconnect
      if (!intentionalDisconnect) {
        setTimeout(() => {
          if (!client?.connected && !isConnecting && !intentionalDisconnect) {
            console.log('Mencoba koneksi ulang setelah offline...');
            connectMqtt(config, options);
          }
        }, 5000);
      }
    });
    
    // Setup manual keepalive check
    if (reconnectInterval) {
      clearInterval(reconnectInterval);
    }
    
    reconnectInterval = setInterval(() => {
      if (client && !client.connected && !isConnecting && !intentionalDisconnect) {
        console.log('Deteksi putus koneksi, mencoba koneksi ulang...');
        disconnectMqtt();
        setTimeout(() => {
          connectMqtt(config, options);
        }, 1000);
      }
    }, 10000); // Check setiap 10 detik
    
  } catch (err) {
    console.error('Error saat setup koneksi MQTT:', err);
    isConnecting = false;
    subscribedTopic = null;
    options.onError(err instanceof Error ? err : new Error('Failed to set up MQTT connection'));
    
    // Coba lagi koneksi setelah beberapa saat
    setTimeout(() => {
      connectMqtt(config, options);
    }, 5000);
  }
}

// Setup ping mechanism untuk menjaga koneksi tetap aktif
function setupPingMechanism(config: MqttConfig, options: MqttConnectionOptions): void {
  // Interval lebih pendek dari keepalive untuk mengirim ping
  const pingInterval = setInterval(() => {
    if (client && client.connected) {
      // Kirim ping dengan publish ke topic khusus
      client.publish('$SYS/ping', 'ping', { qos: 0, retain: false }, (err) => {
        if (err) {
          console.warn('Gagal mengirim ping:', err.message);
        }
      });
    } else if (!client || !client.connected) {
      // Jika tidak terhubung, coba connect ulang
      if (!isConnecting && !intentionalDisconnect) {
        console.log('Ping check: koneksi terputus, mencoba ulang...');
        clearInterval(pingInterval);
        disconnectMqtt();
        setTimeout(() => {
          connectMqtt(config, options);
        }, 1000);
      }
    }
  }, 10000); // Ping setiap 10 detik
  
  // Simpan interval di client
  if (client) {
    (client as any)._pingInterval = pingInterval;
  }
}

// Disconnect from MQTT broker
export function disconnectMqtt(): void {
  intentionalDisconnect = true;
  
  if (reconnectInterval) {
    clearInterval(reconnectInterval);
    reconnectInterval = null;
  }
  
  if (client) {
    try {
      // Clear ping interval
      if ((client as any)._pingInterval) {
        clearInterval((client as any)._pingInterval);
        (client as any)._pingInterval = null;
      }
      
      // Unsubscribe from topic if subscribed
      if (subscribedTopic) {
        client.unsubscribe(subscribedTopic, (err) => {
          if (err) {
            console.warn('Error unsubscribe:', err.message);
          }
        });
      }
      
      // End client connection (force = true)
      client.end(true, {}, () => {
        console.log('MQTT client terminated');
        client = null;
        isConnecting = false;
        subscribedTopic = null;
      });
    } catch (err) {
      console.error('Error saat disconnect MQTT:', err);
    } finally {
      client = null;
      isConnecting = false;
      subscribedTopic = null;
    }
  }
  
  // Reset flag after disconnect
  setTimeout(() => {
    intentionalDisconnect = false;
  }, 1000);
}

// Check if connected to MQTT broker
export function isMqttConnected(): boolean {
  return client !== null && client.connected;
}

// Check if subscribed to topic
export function isSubscribed(): boolean {
  return subscribedTopic !== null;
} 