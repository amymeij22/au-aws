export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      weather_data: {
        Row: {
          id: string
          timestamp: string
          temperature: number
          humidity: number
          pressure: number
          radiation: number
          wind_speed: number
          wind_direction: number
          rainfall: number
          station_id: string
          created_at: string
        }
        Insert: {
          id?: string
          timestamp: string
          temperature: number
          humidity: number
          pressure: number
          radiation: number
          wind_speed: number
          wind_direction: number
          rainfall: number
          station_id: string
          created_at?: string
        }
        Update: {
          id?: string
          timestamp?: string
          temperature?: number
          humidity?: number
          pressure?: number
          radiation?: number
          wind_speed?: number
          wind_direction?: number
          rainfall?: number
          station_id?: string
          created_at?: string
        }
      }
      stations: {
        Row: {
          id: string
          name: string
          wmo_number: string
          latitude: number
          longitude: number
          elevation: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          wmo_number: string
          latitude: number
          longitude: number
          elevation: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          wmo_number?: string
          latitude?: number
          longitude?: number
          elevation?: number
          created_at?: string
        }
      }
      mqtt_config: {
        Row: {
          id: string
          url: string
          port: number
          topic: string
          username: string | null
          password: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          url: string
          port: number
          topic: string
          username?: string | null
          password?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          url?: string
          port?: number
          topic?: string
          username?: string | null
          password?: string | null
          is_active?: boolean
          created_at?: string
        }
      }
      admins: {
        Row: {
          id: string
          username: string
          password: string
          full_name: string
          role: string
          created_at: string
          last_login: string | null
        }
        Insert: {
          id?: string
          username: string
          password: string
          full_name: string
          role?: string
          created_at?: string
          last_login?: string | null
        }
        Update: {
          id?: string
          username?: string
          password?: string
          full_name?: string
          role?: string
          created_at?: string
          last_login?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_admin_password: {
        Args: {
          p_username: string
          p_password: string
        }
        Returns: {
          id: string
          username: string
          full_name: string
          role: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
} 