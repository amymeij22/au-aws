import type { Admin } from "@/types/admin"
import type { MqttConfig } from "@/types/mqtt"
import type { WeatherData, StationMetadata } from "@/types/weather"

// Generate dummy historical data for the past 24 hours
export const dummyHistoricalData: WeatherData[] = Array.from({ length: 24 }, (_, i) => {
  const date = new Date()
  date.setHours(date.getHours() - (24 - i))

  // Base values
  const baseTemp = 25 + Math.sin(i / 3) * 5
  const baseHumidity = 60 + Math.cos(i / 2) * 15
  const basePressure = 1013 + Math.sin(i / 6) * 3
  const baseRadiation = i < 6 || i > 18 ? 50 : 500 + Math.sin(((i - 6) / 12) * Math.PI) * 400
  const baseWindSpeed = 2 + Math.random() * 3
  const baseWindDirection = (i * 15) % 360
  const baseRainfall = i > 12 && i < 16 ? 0.5 + Math.random() : Math.random() * 0.2

  return {
    timestamp: date.toISOString(),
    temperature: baseTemp,
    humidity: baseHumidity,
    pressure: basePressure,
    radiation: baseRadiation,
    windSpeed: baseWindSpeed,
    windDirection: baseWindDirection,
    rainfall: baseRainfall,
  }
})

// Dummy station metadata
export const dummyStationMetadata: StationMetadata = {
  id: "station-1",
  name: "AWS Lanud Halim Perdanakusuma",
  wmoNumber: "96749",
  latitude: -6.2655,
  longitude: 106.8859,
  elevation: 26,
}

// Dummy admin users
export const dummyAdmins: Admin[] = [
  {
    id: "admin-1",
    name: "Administrator",
    email: "admin@tniau.mil.id",
    password: "admin123",
  },
  {
    id: "admin-2",
    name: "Operator AWS",
    email: "operator@tniau.mil.id",
    password: "operator123",
  },
]

// Dummy MQTT configuration
export const dummyMqttConfig: MqttConfig = {
  url: "wss://broker.hivemq.com:8884/mqtt",
  topic: "aws/tniau/#",
  isActive: true,
}
