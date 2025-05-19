"use client"

import { useEffect, useRef } from "react"
import { useWeatherData } from "@/context/weather-data-context"
import { Doughnut } from "react-chartjs-2"
import { Chart as ChartJS, ArcElement, Tooltip, Legend, Title, type ChartOptions } from "chart.js"

ChartJS.register(ArcElement, Tooltip, Legend, Title)

interface WindDirectionDistributionProps {
  height?: number
}

export default function WindDirectionDistribution({ height = 150 }: WindDirectionDistributionProps) {
  const { historicalData } = useWeatherData()
  const chartRef = useRef<ChartJS>(null)

  useEffect(() => {
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy()
      }
    }
  }, [])

  // Group wind directions into 8 sectors (N, NE, E, SE, S, SW, W, NW)
  const directionCounts = [0, 0, 0, 0, 0, 0, 0, 0]
  const directionLabels = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"]
  const directionColors = [
    "rgba(59, 130, 246, 0.8)", // N - Blue
    "rgba(16, 185, 129, 0.8)", // NE - Green
    "rgba(217, 119, 6, 0.8)", // E - Orange
    "rgba(239, 68, 68, 0.8)", // SE - Red
    "rgba(236, 72, 153, 0.8)", // S - Pink
    "rgba(168, 85, 247, 0.8)", // SW - Purple
    "rgba(99, 102, 241, 0.8)", // W - Indigo
    "rgba(8, 145, 178, 0.8)", // NW - Cyan
  ]

  historicalData.forEach((item) => {
    const direction = item.windDirection
    // Convert direction to sector index (0-7)
    const sectorIndex = Math.floor(((direction + 22.5) % 360) / 45)
    directionCounts[sectorIndex]++
  })

  const data = {
    labels: directionLabels,
    datasets: [
      {
        label: "Distribusi Arah Angin",
        data: directionCounts,
        backgroundColor: directionColors,
        borderColor: directionColors.map((color) => color.replace("0.8", "1")),
        borderWidth: 1,
      },
    ],
  }

  const options: ChartOptions<"doughnut"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "right",
        labels: {
          font: {
            size: 10,
          },
          boxWidth: 10,
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || ""
            const value = context.raw as number
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0) as number
            const percentage = Math.round((value / total) * 100)
            return `${label}: ${value} (${percentage}%)`
          },
          title: (tooltipItems) => {
            return `Arah Angin: ${tooltipItems[0].label}`
          }
        },
      },
      title: {
        display: false,
      },
    },
  }

  return (
    <div style={{ height: `${height}px` }}>
      <Doughnut data={data} options={options} />
    </div>
  )
}
