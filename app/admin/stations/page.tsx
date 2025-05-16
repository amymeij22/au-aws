"use client"

import { useEffect, useState } from "react"
import { useAdmin } from "@/context/admin-context"
import { useWeatherData } from "@/context/weather-data-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Pencil, Plus, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { Skeleton } from "@/components/ui/skeleton"
import StationForm from "@/components/admin/station-form"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import type { StationMetadata } from "@/types/weather"

export default function StationsPage() {
  const { isAuthenticated, isLoading } = useAdmin()
  const { stationMetadata, addStationMetadata, updateStationMetadata, deleteStationMetadata } = useWeatherData()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedStation, setSelectedStation] = useState<StationMetadata | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && !isLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [mounted, isLoading, isAuthenticated, router])

  const handleEdit = (station: StationMetadata) => {
    setSelectedStation(station)
    setIsEditDialogOpen(true)
  }

  const handleDelete = (station: StationMetadata) => {
    setSelectedStation(station)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    if (selectedStation) {
      deleteStationMetadata(selectedStation.id)
      setIsDeleteDialogOpen(false)
      setSelectedStation(null)
    }
  }

  if (!mounted || isLoading || !isAuthenticated) {
    return <StationsPageSkeleton />
  }

  const stations = stationMetadata ? [stationMetadata] : []

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Pengelolaan Stasiun</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Tambah Stasiun
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tambah Stasiun Baru</DialogTitle>
              <DialogDescription>Isi form berikut untuk menambahkan stasiun baru.</DialogDescription>
            </DialogHeader>
            <StationForm
              onSubmit={(data) => {
                addStationMetadata(data)
                setIsAddDialogOpen(false)
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Stasiun</CardTitle>
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
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(station)}>
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
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
          {selectedStation && (
            <StationForm
              station={selectedStation}
              onSubmit={(data) => {
                updateStationMetadata({ ...data, id: selectedStation.id })
                setIsEditDialogOpen(false)
                setSelectedStation(null)
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Hapus</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus stasiun {selectedStation?.name}? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function StationsPageSkeleton() {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <Skeleton className="h-10 w-[200px] md:w-[250px]" />
        <Skeleton className="h-10 w-[150px]" />
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
            {Array(2)
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
