export interface MqttConfig {
  id: string
  url: string
  port: number
  topic: string
  username?: string
  password?: string
  isActive: boolean
}

export interface HiveMqPayload {
  Temp: number
  Rh: number
  "wind.Direction": number
  "wind.Speed": number
  pressure: number
  radiation: number
  precipitation: number
  timestamp: number | string
}

// Interface untuk MqttPacket dengan tipe yang benar
export interface MqttPacket {
  cmd?: string
  messageId?: number
  payload?: Buffer
  qos?: number
  retain?: boolean
  dup?: boolean
  topic?: string
}
