"use client"

import { useEffect, useState } from "react"
import { useAdmin } from "@/context/admin-context"
import { useWeatherData } from "@/context/weather-data-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Pencil } from "lucide-react"
import { useRouter } from "next/navigation"
import { Skeleton } from "@/components/ui/skeleton"
import StationForm from "@/components/admin/station-form"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { StationMetadata } from "@/types/weather"

export default function StationsPage() {
  const { isAuthenticated, isLoading } = useAdmin()
  const { stationMetadata, updateStationMetadata } = useWeatherData()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && !isLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [mounted, isLoading, isAuthenticated, router])

  const handleEdit = (station: StationMetadata) => {
    setIsEditDialogOpen(true)
  }

  if (!mounted || isLoading || !isAuthenticated) {
    return <StationsPageSkeleton />
  }

  const stations = stationMetadata ? [stationMetadata] : []

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Pengelolaan Stasiun</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Metadata Stasiun</CardTitle>
          <CardDescription>Kelola metadata stasiun cuaca.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Stasiun</TableHead>
                <TableHead>No. WMO</TableHead>
                <TableHead>Latitude</TableHead>
                <TableHead>Longitude</TableHead>
                <TableHead>Elevasi (mdpl)</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    Tidak ada data stasiun
                  </TableCell>
                </TableRow>
              ) : (
                stations.map((station) => (
                  <TableRow key={station.id}>
                    <TableCell>{station.name}</TableCell>
                    <TableCell>{station.wmoNumber}</TableCell>
                    <TableCell>{station.latitude}</TableCell>
                    <TableCell>{station.longitude}</TableCell>
                    <TableCell>{station.elevation}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(station)}>
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Stasiun</DialogTitle>
            <DialogDescription>Ubah informasi stasiun.</DialogDescription>
          </DialogHeader>
          {stationMetadata && (
            <StationForm
              station={stationMetadata}
              onSubmit={(data) => {
                updateStationMetadata({ ...data, id: stationMetadata.id })
                setIsEditDialogOpen(false)
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function StationsPageSkeleton() {
  return (
    <div>
      <div className="mb-6">
        <Skeleton className="h-10 w-[200px] md:w-[250px]" />
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-[150px]" />
          <Skeleton className="h-4 w-[250px]" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <Skeleton className="h-5 w-[100px]" />
              <Skeleton className="h-5 w-[80px]" />
              <Skeleton className="h-5 w-[80px]" />
              <Skeleton className="h-5 w-[80px]" />
              <Skeleton className="h-5 w-[80px]" />
              <Skeleton className="h-5 w-[80px]" />
            </div>
            {Array(1)
              .fill(0)
              .map((_, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b">
                  <Skeleton className="h-5 w-[150px]" />
                  <Skeleton className="h-5 w-[80px]" />
                  <Skeleton className="h-5 w-[80px]" />
                  <Skeleton className="h-5 w-[80px]" />
                  <Skeleton className="h-5 w-[80px]" />
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-8 rounded-md" />
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
