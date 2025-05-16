"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { StationMetadata } from "@/types/weather"
import { toast } from "@/components/ui/use-toast"

interface StationFormProps {
  station?: StationMetadata
  onSubmit: (data: Omit<StationMetadata, "id">) => void
}

export default function StationForm({ station, onSubmit }: StationFormProps) {
  const [name, setName] = useState(station?.name || "")
  const [wmoNumber, setWmoNumber] = useState(station?.wmoNumber || "")
  const [latitude, setLatitude] = useState(station?.latitude?.toString() || "")
  const [longitude, setLongitude] = useState(station?.longitude?.toString() || "")
  const [elevation, setElevation] = useState(station?.elevation?.toString() || "")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      onSubmit({
        name,
        wmoNumber,
        latitude: Number.parseFloat(latitude),
        longitude: Number.parseFloat(longitude),
        elevation: Number.parseFloat(elevation),
      })

      toast({
        title: station ? "Stasiun diperbarui" : "Stasiun ditambahkan",
        description: station ? "Data stasiun berhasil diperbarui." : "Stasiun baru berhasil ditambahkan.",
      })
    } catch (error) {
      toast({
        title: "Terjadi kesalahan",
        description: "Gagal menyimpan data stasiun.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nama Stasiun</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="wmoNumber">No. WMO</Label>
        <Input id="wmoNumber" value={wmoNumber} onChange={(e) => setWmoNumber(e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="latitude">Latitude</Label>
        <Input
          id="latitude"
          type="number"
          step="0.000001"
          value={latitude}
          onChange={(e) => setLatitude(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="longitude">Longitude</Label>
        <Input
          id="longitude"
          type="number"
          step="0.000001"
          value={longitude}
          onChange={(e) => setLongitude(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="elevation">Elevasi (mdpl)</Label>
        <Input
          id="elevation"
          type="number"
          step="0.1"
          value={elevation}
          onChange={(e) => setElevation(e.target.value)}
          required
        />
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Menyimpan..." : station ? "Perbarui Stasiun" : "Tambah Stasiun"}
      </Button>
    </form>
  )
}
