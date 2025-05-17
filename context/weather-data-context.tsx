"use client"

import { createContext, useContext, useState, useEffect, type ReactNode, useRef } from "react"
import type { WeatherData, StationMetadata } from "@/types/weather"
import { supabase } from "@/lib/supabase"

interface WeatherDataContextType {
  currentData: WeatherData | null
  historicalData: WeatherData[]
  stationMetadata: StationMetadata | null
  lastUpdated: string | null
  addWeatherData: (data: WeatherData) => void
  clearHistoricalData: () => Promise<boolean>
  addStationMetadata: (data: Omit<StationMetadata, "id">) => Promise<void>
  updateStationMetadata: (data: StationMetadata) => Promise<void>
  deleteStationMetadata: (id: string) => Promise<void>
  isLoading: boolean
  error: string | null
}

const WeatherDataContext = createContext<WeatherDataContextType | undefined>(undefined)

// Fungsi untuk membuat objek StationMetadata default
const createDefaultStationMetadata = (): StationMetadata => ({
  id: "default",
  name: "Belum Ada Data",
  wmoNumber: "00000",
  latitude: 0,
  longitude: 0,
  elevation: 0
})

// Fungsi untuk membuat WeatherData default dengan timestamp saat ini
const createDefaultWeatherData = (): WeatherData => ({
  timestamp: new Date().toISOString(),
  temperature: 0,
  humidity: 0,
  pressure: 0,
  radiation: 0,
  windSpeed: 0,
  windDirection: 0,
  rainfall: 0
})

// Maksimum entri cache yang disimpan
const MAX_PROCESSED_TIMESTAMPS = 1000;

// Interval polling database (ms)
const DB_POLL_INTERVAL = 30000; // 30 detik

// Key untuk shared storage
const PROCESSED_TIMESTAMPS_KEY = 'processed_weather_timestamps';
const POLLING_ACTIVE_KEY = 'weather_polling_active';

export function WeatherDataProvider({ children }: { children: ReactNode }) {
  const [currentData, setCurrentData] = useState<WeatherData | null>(null)
  const [historicalData, setHistoricalData] = useState<WeatherData[]>([])
  const [stationMetadata, setStationMetadata] = useState<StationMetadata | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  
  // Cache untuk menyimpan timestamp yang sudah diproses dan mencegah duplikasi
  const processedTimestamps = useRef<Set<string>>(new Set());
  
  // Daftar timestamp yang diurutkan untuk kontrol ukuran cache
  const timestampList = useRef<string[]>([]);
  
  // Reload BroadcastChannel untuk sinkronisasi antar tab
  const broadcastChannel = useRef<BroadcastChannel | null>(null);
  
  // Inisialisasi BroadcastChannel untuk komunikasi antar tab
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Gunakan BroadcastChannel untuk komunikasi antar tab
      broadcastChannel.current = new BroadcastChannel('weather_data_sync');
      
      // Dengarkan pesan dari tab lain
      broadcastChannel.current.onmessage = (event) => {
        const { type, data } = event.data;
        
        if (type === 'NEW_TIMESTAMP') {
          // Tambahkan timestamp ke cache lokal
          addToProcessedCache(data.timestamp);
        }
      };
      
      // Load cache tersimpan dari localStorage
      loadProcessedTimestamps();
      
      // Cleanup saat unmount
      return () => {
        if (broadcastChannel.current) {
          broadcastChannel.current.close();
        }
      };
    }
  }, []);
  
  // Menyimpan processedTimestamps ke localStorage
  const saveProcessedTimestamps = () => {
    if (typeof window !== 'undefined') {
      const timestampsArray = Array.from(processedTimestamps.current);
      try {
        localStorage.setItem(PROCESSED_TIMESTAMPS_KEY, JSON.stringify(timestampsArray));
      } catch (e) {
        console.error('Failed to save processed timestamps to localStorage:', e);
      }
    }
  };
  
  // Memuat processedTimestamps dari localStorage
  const loadProcessedTimestamps = () => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(PROCESSED_TIMESTAMPS_KEY);
        if (saved) {
          const timestamps = JSON.parse(saved) as string[];
          
          // Reset current cache
          processedTimestamps.current = new Set(timestamps);
          timestampList.current = [...timestamps];
          
          // Batasi ukuran cache jika melebihi batas
          while (timestampList.current.length > MAX_PROCESSED_TIMESTAMPS) {
            const oldestTimestamp = timestampList.current.shift();
            if (oldestTimestamp) {
              processedTimestamps.current.delete(oldestTimestamp);
            }
          }
        }
      } catch (e) {
        console.error('Failed to load processed timestamps from localStorage:', e);
      }
    }
  };

  // Fetch station data from Supabase
  useEffect(() => {
    async function fetchStationData() {
      try {
        const { data: stationData, error: stationError } = await supabase
          .from('stations')
          .select('*')
          .limit(1)
          .single()

        if (stationError) {
          console.error('Error fetching station data:', stationError)
          // Gunakan default station metadata jika tidak ada data
          setStationMetadata(createDefaultStationMetadata())
        } else if (stationData) {
          // Map the Supabase format to our app format
          setStationMetadata({
            id: stationData.id,
            name: stationData.name,
            wmoNumber: stationData.wmo_number,
            latitude: stationData.latitude,
            longitude: stationData.longitude,
            elevation: stationData.elevation
          })
        } else {
          // Gunakan default station metadata jika tidak ada data
          setStationMetadata(createDefaultStationMetadata())
        }

        setIsLoading(false)
      } catch (err) {
        console.error('Unexpected error:', err)
        setError('Gagal memuat data stasiun')
        setStationMetadata(createDefaultStationMetadata())
        setIsLoading(false)
      }
    }

    fetchStationData()
  }, [])

  // Poll database untuk data cuaca terbaru
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    let isActive = false;
    
    async function fetchLatestWeatherData() {
      if (isLoading) return;
      
      try {
        // Ambil data yang belum ada di historicalData
        const latestTimestamp = currentData?.timestamp ? new Date(currentData.timestamp) : new Date(0);
        
        // Format untuk query
        const formattedTimestamp = latestTimestamp.toISOString();
        
        const { data: newData, error: dataError } = await supabase
          .from('weather_data')
          .select('*')
          .gt('timestamp', formattedTimestamp) // Hanya ambil data baru
          .order('timestamp', { ascending: true });
          
        if (dataError) {
          console.error('Error polling weather data:', dataError);
          return;
        }
        
        if (newData && newData.length > 0) {
          // Map data format dari Supabase
          const formattedNewData: WeatherData[] = newData.map(item => ({
            timestamp: item.timestamp,
            temperature: item.temperature,
            humidity: item.humidity,
            pressure: item.pressure,
            radiation: item.radiation,
            windSpeed: item.wind_speed,
            windDirection: item.wind_direction,
            rainfall: item.rainfall
          }));
          
          // Tambahkan timestamp ke cache
          formattedNewData.forEach(item => {
            if (!isDataProcessed(item.timestamp)) {
              addToProcessedCache(item.timestamp);
            }
          });
          
          // Update historical data
          setHistoricalData(prev => {
            // Filter duplikat
            const existingTimestamps = new Set(prev.map(item => item.timestamp));
            const uniqueNewData = formattedNewData.filter(item => !existingTimestamps.has(item.timestamp));
            
            if (uniqueNewData.length === 0) return prev;
            
            // Tambahkan data baru ke array yang ada
            const combined = [...prev, ...uniqueNewData];
            
            // Filter data lebih lama dari 24 jam
            const twentyFourHoursAgo = new Date();
            twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
            
            return combined
              .filter(item => new Date(item.timestamp) >= twentyFourHoursAgo)
              .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
          });
          
          // Update current data
          if (formattedNewData.length > 0) {
            const newestData = formattedNewData[formattedNewData.length - 1];
            setCurrentData(newestData);
            setLastUpdated(newestData.timestamp);
          }
        }
      } catch (err) {
        console.error('Error in polling weather data:', err);
      }
    }
    
    const setupPolling = () => {
      // Cek apakah tab ini yang akan melakukan polling (mencegah semua tab melakukan polling)
      if (typeof window !== 'undefined') {
        const existingPoller = localStorage.getItem(POLLING_ACTIVE_KEY);
        const currentTime = Date.now();
        
        if (!existingPoller || (currentTime - parseInt(existingPoller)) > DB_POLL_INTERVAL * 1.5) {
          // Set tab ini sebagai poller aktif atau perbarui waktu poller
          localStorage.setItem(POLLING_ACTIVE_KEY, currentTime.toString());
          isActive = true;
          
          // Mulai polling
          intervalId = setInterval(() => {
            fetchLatestWeatherData();
            // Perbarui timestamp poller aktif
            localStorage.setItem(POLLING_ACTIVE_KEY, Date.now().toString());
          }, DB_POLL_INTERVAL);
          
          // Load data awal
          fetchLatestWeatherData();
        }
      }
    };
    
    // Setup polling
    setupPolling();
    
    // Periksa tiap 5 detik apakah poller aktif masih berjalan
    const checkPollerInterval = setInterval(() => {
      if (typeof window !== 'undefined') {
        const existingPoller = localStorage.getItem(POLLING_ACTIVE_KEY);
        const currentTime = Date.now();
        
        // Jika poller sudah tidak aktif (timeout), aktifkan di tab ini
        if (!existingPoller || (currentTime - parseInt(existingPoller)) > DB_POLL_INTERVAL * 1.5) {
          if (!isActive) {
            clearInterval(intervalId);
            setupPolling();
          }
        }
      }
    }, 5000);
    
    // Cleanup
    return () => {
      clearInterval(intervalId);
      clearInterval(checkPollerInterval);
      if (isActive && typeof window !== 'undefined') {
        localStorage.removeItem(POLLING_ACTIVE_KEY);
      }
    };
  }, [isLoading, currentData]);

  // Fetch initial weather data from Supabase
  useEffect(() => {
    async function fetchWeatherData() {
      try {
        // Get the timestamp for 24 hours ago
        const twentyFourHoursAgo = new Date()
        twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24)

        const { data: weatherData, error: weatherError } = await supabase
          .from('weather_data')
          .select('*')
          .gte('timestamp', twentyFourHoursAgo.toISOString())
          .order('timestamp', { ascending: true })

        if (weatherError) {
          console.error('Error fetching weather data:', weatherError)
          // Gunakan array kosong jika error
          setHistoricalData([])
          setCurrentData(null)
          setLastUpdated(null)
        } else if (weatherData && weatherData.length > 0) {
          // Map the Supabase format to our app format
          const formattedData: WeatherData[] = weatherData.map(item => ({
            timestamp: item.timestamp,
            temperature: item.temperature,
            humidity: item.humidity,
            pressure: item.pressure,
            radiation: item.radiation,
            windSpeed: item.wind_speed,
            windDirection: item.wind_direction,
            rainfall: item.rainfall
          }))
          
          // Tambahkan semua timestamp yang sudah ada ke cache
          formattedData.forEach(item => {
            addToProcessedCache(item.timestamp);
          });

          setHistoricalData(formattedData)
          setCurrentData(formattedData[formattedData.length - 1])
          setLastUpdated(formattedData[formattedData.length - 1].timestamp)
        } else {
          // Array kosong jika tidak ada data
          setHistoricalData([])
          setCurrentData(null)
          setLastUpdated(null)
        }
      } catch (err) {
        console.error('Unexpected error:', err)
        setError('Gagal memuat data cuaca')
        // Gunakan array kosong jika error
        setHistoricalData([])
        setCurrentData(null)
        setLastUpdated(null)
      }
    }

    fetchWeatherData()
  }, [])
  
  // Fungsi untuk menambahkan timestamp ke cache
  const addToProcessedCache = (timestamp: string) => {
    // Cek apakah timestamp sudah ada dalam cache
    if (!processedTimestamps.current.has(timestamp)) {
      // Tambahkan ke Set untuk pengecekan cepat
      processedTimestamps.current.add(timestamp);
      
      // Tambahkan ke array yang diurutkan
      timestampList.current.push(timestamp);
      
      // Jika melebihi batas, hapus entri tertua
      if (timestampList.current.length > MAX_PROCESSED_TIMESTAMPS) {
        const oldestTimestamp = timestampList.current.shift();
        if (oldestTimestamp) {
          processedTimestamps.current.delete(oldestTimestamp);
        }
      }
      
      // Simpan ke localStorage
      saveProcessedTimestamps();
      
      // Broadcast ke tab lain
      if (broadcastChannel.current) {
        broadcastChannel.current.postMessage({
          type: 'NEW_TIMESTAMP',
          data: { timestamp }
        });
      }
    }
  };
  
  // Fungsi untuk memeriksa apakah data sudah diproses
  const isDataProcessed = (timestamp: string): boolean => {
    return processedTimestamps.current.has(timestamp);
  };

  const addWeatherData = async (data: WeatherData) => {
    try {
      // Check if this exact timestamp has already been processed (in any tab/device)
      if (isDataProcessed(data.timestamp)) {
        // Sudah diproses sebelumnya, lewati
        return;
      }
      
      // Check for duplicates in current historical data
      const isDuplicate = historicalData.some((item) => item.timestamp === data.timestamp);
      if (isDuplicate) {
        // Data duplikat dalam state lokal, lewati
        return;
      }
      
      // Add this timestamp to processed list first
      addToProcessedCache(data.timestamp);

      // Cek langsung ke database apakah data dengan timestamp yang sama sudah ada
      const { data: existingData, error: checkError } = await supabase
        .from('weather_data')
        .select('id')
        .eq('timestamp', data.timestamp)
        .maybeSingle();
      
      if (checkError) {
        // Error checking for duplicates silently handled
      }
      
      // Jika data sudah ada di database, tidak perlu insert lagi
      if (existingData) {
        // Update local state saja tanpa insert ulang ke database
        updateLocalState(data);
        return;
      }

      // Add to Supabase
      if (stationMetadata) {
        const { data: insertedData, error: insertError } = await supabase
          .from('weather_data')
          .insert([
            {
              timestamp: data.timestamp,
              temperature: data.temperature,
              humidity: data.humidity,
              pressure: data.pressure,
              radiation: data.radiation,
              wind_speed: data.windSpeed,
              wind_direction: data.windDirection,
              rainfall: data.rainfall,
              station_id: stationMetadata.id
            }
          ])
          .select()

        if (insertError) {
          // Cek apakah error karena duplicate constraint
          if (insertError.code === '23505') { // PostgreSQL duplicate key violation
            // Diam-diam lewati duplikat yang terdeteksi
          } else {
            setError(`Gagal menyimpan data cuaca: ${insertError.message}`);
          }
          
          // Tetap update local state
          updateLocalState(data);
        } else {
          setError(null);
          
          // Update local state
          updateLocalState(data);
        }
      } else {
        console.warn('No station metadata available, updating local state only');
        updateLocalState(data);
      }
    } catch (err) {
      console.error('Error adding weather data:', err);
      setError('Gagal menambahkan data cuaca');
      
      // Tetap update local state meskipun error
      updateLocalState(data);
    }
  }
  
  // Fungsi pembantu untuk memperbarui state lokal
  const updateLocalState = (data: WeatherData) => {
    // Update current data
    setCurrentData(data);
    
    // Update historical data
    setHistoricalData((prev) => {
      // Keep only the last 24 hours of data
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

      const filtered = prev.filter((item) => 
        new Date(item.timestamp) >= twentyFourHoursAgo && 
        item.timestamp !== data.timestamp // Buang data lama dengan timestamp sama
      );

      return [...filtered, data].sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
    });
    
    // Update last updated timestamp
    setLastUpdated(data.timestamp);
  }

  const clearHistoricalData = async () => {
    try {
      let error = null;
      
      // Pendekatan utama: Menggunakan TRUNCATE melalui RPC
      const { error: rpcError } = await supabase.rpc('truncate_weather_data');
      
      // Jika RPC gagal, coba pendekatan alternatif dengan delete satu per satu
      if (rpcError) {
        console.warn('RPC truncate_weather_data gagal:', rpcError.message);
        console.warn('Mencoba pendekatan alternatif...');
        
        // Pendekatan alternatif: Ambil semua ID dan hapus satu per satu
        const { data: allData, error: fetchError } = await supabase
          .from('weather_data')
          .select('id')
          .limit(10000);
        
        if (fetchError) {
          error = fetchError;
        } else if (allData && allData.length > 0) {
          // Buat array of IDs
          const ids = allData.map(item => item.id);
          
          // Hapus data berdasarkan daftar ID
          const { error: deleteError } = await supabase
            .from('weather_data')
            .delete()
            .in('id', ids);
          
          if (deleteError) {
            error = deleteError;
          }
        }
      }
      
      if (error) {
        console.error('Error deleting weather data from database:', error);
        setError('Gagal menghapus data cuaca dari database');
        return false;
      }
      
      // Reset state lokal
      setHistoricalData([]);
      setCurrentData(null);
      setLastUpdated(null);
      
      // Reset cache
      processedTimestamps.current.clear();
      timestampList.current = [];
      
      // Hapus data dari localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem(PROCESSED_TIMESTAMPS_KEY);
      }
      
      // Broadcast penghapusan ke tab lain
      if (broadcastChannel.current) {
        broadcastChannel.current.postMessage({
          type: 'CLEAR_ALL_DATA',
          data: { timestamp: new Date().toISOString() }
        });
      }
      
      setError(null);
      return true;
    } catch (err) {
      console.error('Error clearing historical data:', err);
      setError('Gagal menghapus data cuaca');
      return false;
    }
  }

  const addStationMetadata = async (data: Omit<StationMetadata, "id">) => {
    try {
      const { data: insertedData, error } = await supabase
        .from('stations')
        .insert([
          {
            name: data.name,
            wmo_number: data.wmoNumber,
            latitude: data.latitude,
            longitude: data.longitude,
            elevation: data.elevation
          }
        ])
        .select()
        .single()

      if (error) {
        console.error('Error adding station metadata:', error)
        setError('Gagal menambahkan metadata stasiun')
        
        // Fall back to local generation if Supabase fails
        const newStation: StationMetadata = {
          ...data,
          id: Math.random().toString(36).substring(2, 9),
        }
        setStationMetadata(newStation)
      } else if (insertedData) {
        const newStation: StationMetadata = {
          id: insertedData.id,
          name: insertedData.name,
          wmoNumber: insertedData.wmo_number,
          latitude: insertedData.latitude,
          longitude: insertedData.longitude,
          elevation: insertedData.elevation
        }
        setStationMetadata(newStation)
      }
    } catch (err) {
      console.error('Unexpected error:', err)
      setError('Gagal menambahkan metadata stasiun')
      
      // Fall back to local generation
    const newStation: StationMetadata = {
      ...data,
      id: Math.random().toString(36).substring(2, 9),
    }
    setStationMetadata(newStation)
    }
  }

  const updateStationMetadata = async (data: StationMetadata) => {
    try {
      const { error } = await supabase
        .from('stations')
        .update({
          name: data.name,
          wmo_number: data.wmoNumber,
          latitude: data.latitude,
          longitude: data.longitude,
          elevation: data.elevation
        })
        .eq('id', data.id)

      if (error) {
        console.error('Error updating station metadata:', error)
        setError('Gagal memperbarui metadata stasiun')
      }

      // Update local state regardless of Supabase result to maintain UI responsiveness
      setStationMetadata(data)
    } catch (err) {
      console.error('Unexpected error:', err)
      setError('Gagal memperbarui metadata stasiun')
    setStationMetadata(data)
    }
  }

  const deleteStationMetadata = async (id: string) => {
    try {
      const { error } = await supabase
        .from('stations')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting station metadata:', error)
        setError('Gagal menghapus metadata stasiun')
      }

      if (stationMetadata?.id === id) {
        setStationMetadata(null)
      }
    } catch (err) {
      console.error('Unexpected error:', err)
      setError('Gagal menghapus metadata stasiun')
      
      // Update local state anyway
    if (stationMetadata?.id === id) {
      setStationMetadata(null)
      }
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
        isLoading,
        error
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
