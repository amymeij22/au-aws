"use client"

import { useEffect, useState } from "react"
import { useAdmin } from "@/context/admin-context"
import { useWeatherData } from "@/context/weather-data-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Calendar, ChevronLeft, ChevronRight, Download, FileJson, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { Skeleton } from "@/components/ui/skeleton"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { format } from "date-fns"
import { formatDate } from "@/lib/utils"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { WeatherData } from "@/types/weather"

export default function HistoryPage() {
  const { isAuthenticated, isLoading } = useAdmin()
  const { historicalData, clearHistoricalData } = useWeatherData()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [filteredData, setFilteredData] = useState<WeatherData[]>([])
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  // Pagination state
  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [paginatedData, setPaginatedData] = useState<WeatherData[]>([])
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && !isLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [mounted, isLoading, isAuthenticated, router])

  useEffect(() => {
    if (date) {
      const selectedDate = new Date(date)
      selectedDate.setHours(0, 0, 0, 0)

      const nextDay = new Date(selectedDate)
      nextDay.setDate(nextDay.getDate() + 1)

      const filtered = historicalData.filter((item) => {
        const itemDate = new Date(item.timestamp)
        return itemDate >= selectedDate && itemDate < nextDay
      })

      setFilteredData(filtered)
      setCurrentPage(1) // Reset to first page when filter changes
    } else {
      setFilteredData(historicalData)
      setCurrentPage(1) // Reset to first page when filter changes
    }
  }, [date, historicalData])

  // Update paginated data when filtered data, page size, or current page changes
  useEffect(() => {
    // Sort data by timestamp in descending order (newest first)
    const sortedData = [...filteredData].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    )

    const totalItems = sortedData.length
    const calculatedTotalPages = Math.ceil(totalItems / pageSize)
    setTotalPages(calculatedTotalPages || 1) // Ensure at least 1 page

    // Adjust current page if it exceeds the new total pages
    if (currentPage > calculatedTotalPages) {
      setCurrentPage(calculatedTotalPages || 1)
    }

    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    setPaginatedData(sortedData.slice(startIndex, endIndex))
  }, [filteredData, pageSize, currentPage])

  const handlePageSizeChange = (value: string) => {
    setPageSize(Number(value))
    setCurrentPage(1) // Reset to first page when page size changes
  }

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const downloadCSV = () => {
    const headers = [
      "Timestamp",
      "Temperature (°C)",
      "Humidity (%)",
      "Pressure (hPa)",
      "Radiation (W/m²)",
      "Wind Speed (m/s)",
      "Wind Direction (°)",
      "Rainfall (mm/h)",
    ]

    const csvRows = [
      headers.join(","),
      ...filteredData.map((item) =>
        [
          new Date(item.timestamp).toISOString(),
          item.temperature.toFixed(1),
          item.humidity.toFixed(1),
          item.pressure.toFixed(1),
          item.radiation.toFixed(1),
          item.windSpeed.toFixed(1),
          item.windDirection.toFixed(0),
          item.rainfall.toFixed(1),
        ].join(","),
      ),
    ]

    const csvContent = csvRows.join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `weather-data-${date ? format(date, "yyyy-MM-dd") : "all"}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const downloadJSON = () => {
    const jsonContent = JSON.stringify(filteredData, null, 2)
    const blob = new Blob([jsonContent], { type: "application/json;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `weather-data-${date ? format(date, "yyyy-MM-dd") : "all"}.json`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (!mounted || isLoading || !isAuthenticated) {
    return <HistoryPageSkeleton />
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold md:text-3xl">Data Cuaca Historis</h1>
        <div className="flex flex-wrap gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto justify-start text-left font-normal">
                <Calendar className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : <span>Pilih tanggal</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <CalendarComponent mode="single" selected={date} onSelect={setDate} initialFocus />
            </PopoverContent>
          </Popover>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={downloadCSV} className="flex-1 sm:flex-none">
              <Download className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Unduh</span> CSV
            </Button>
            <Button variant="outline" onClick={downloadJSON} className="flex-1 sm:flex-none">
              <FileJson className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Unduh</span> JSON
            </Button>
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="flex-1 sm:flex-none">
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Hapus</span> Data
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Konfirmasi Hapus</AlertDialogTitle>
                  <AlertDialogDescription>
                    Apakah Anda yakin ingin menghapus semua data historis? Tindakan ini tidak dapat dibatalkan.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Batal</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      clearHistoricalData()
                      setIsDeleteDialogOpen(false)
                    }}
                  >
                    Hapus
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>{date ? `Data Cuaca - ${format(date, "d MMMM yyyy")}` : "Semua Data Cuaca"}</CardTitle>
              <CardDescription>{filteredData.length} data ditemukan</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Tampilkan:</span>
              <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
                <SelectTrigger className="w-[80px]">
                  <SelectValue placeholder="10" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                  <SelectItem value="1000">1000</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Waktu</TableHead>
                  <TableHead>Suhu (°C)</TableHead>
                  <TableHead>Kelembapan (%)</TableHead>
                  <TableHead>Tekanan (hPa)</TableHead>
                  <TableHead>Radiasi (W/m²)</TableHead>
                  <TableHead>Kec. Angin (m/s)</TableHead>
                  <TableHead>Arah Angin (°)</TableHead>
                  <TableHead>Curah Hujan (mm/jam)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center">
                      Tidak ada data
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedData.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{formatDate(item.timestamp)}</TableCell>
                      <TableCell>{item.temperature.toFixed(1)}</TableCell>
                      <TableCell>{item.humidity.toFixed(1)}</TableCell>
                      <TableCell>{item.pressure.toFixed(1)}</TableCell>
                      <TableCell>{item.radiation.toFixed(1)}</TableCell>
                      <TableCell>{item.windSpeed.toFixed(1)}</TableCell>
                      <TableCell>{item.windDirection.toFixed(0)}</TableCell>
                      <TableCell>{item.rainfall.toFixed(1)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination controls */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-4 gap-4">
            <div className="text-sm text-muted-foreground">
              Menampilkan {paginatedData.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} -{" "}
              {Math.min(currentPage * pageSize, filteredData.length)} dari {filteredData.length} data
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={goToPrevPage} disabled={currentPage === 1}>
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">Halaman sebelumnya</span>
              </Button>
              <div className="text-sm">
                Halaman {currentPage} dari {totalPages}
              </div>
              <Button variant="outline" size="sm" onClick={goToNextPage} disabled={currentPage === totalPages}>
                <ChevronRight className="h-4 w-4" />
                <span className="sr-only">Halaman berikutnya</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function HistoryPageSkeleton() {
  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Skeleton className="h-10 w-[200px] md:w-[250px]" />
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-10 w-full sm:w-[240px]" />
          <div className="flex gap-2 w-full sm:w-auto">
            <Skeleton className="h-10 flex-1 sm:w-[120px]" />
            <Skeleton className="h-10 flex-1 sm:w-[120px]" />
            <Skeleton className="h-10 flex-1 sm:w-[120px]" />
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <Skeleton className="h-6 w-[200px]" />
              <Skeleton className="h-4 w-[150px]" />
            </div>
            <Skeleton className="h-10 w-[120px]" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <div className="p-4">
              <div className="flex items-center justify-between border-b pb-2">
                <Skeleton className="h-5 w-[80px]" />
                <Skeleton className="h-5 w-[80px]" />
                <Skeleton className="h-5 w-[80px]" />
                <Skeleton className="h-5 w-[80px]" />
                <Skeleton className="h-5 w-[80px]" />
                <Skeleton className="h-5 w-[80px]" />
                <Skeleton className="h-5 w-[80px]" />
                <Skeleton className="h-5 w-[80px]" />
              </div>
              {Array(5)
                .fill(0)
                .map((_, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b">
                    <Skeleton className="h-5 w-[80px]" />
                    <Skeleton className="h-5 w-[80px]" />
                    <Skeleton className="h-5 w-[80px]" />
                    <Skeleton className="h-5 w-[80px]" />
                    <Skeleton className="h-5 w-[80px]" />
                    <Skeleton className="h-5 w-[80px]" />
                    <Skeleton className="h-5 w-[80px]" />
                    <Skeleton className="h-5 w-[80px]" />
                  </div>
                ))}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-4 gap-4">
            <Skeleton className="h-5 w-[200px]" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8 rounded-md" />
              <Skeleton className="h-5 w-[100px]" />
              <Skeleton className="h-8 w-8 rounded-md" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
