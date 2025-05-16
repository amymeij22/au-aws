export interface WeatherData {
  timestamp: string
  temperature: number
  humidity: number
  pressure: number
  radiation: number
  windSpeed: number
  windDirection: number
  rainfall: number
}

export interface StationMetadata {
  id: string
  name: string
  wmoNumber: string
  latitude: number
  longitude: number
  elevation: number
}
