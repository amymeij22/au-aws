"use client"

import { useEffect, useRef } from "react"
import { useWeatherData } from "@/context/weather-data-context"
import { Bar } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  type ChartOptions,
} from "chart.js"
import { format } from "date-fns"

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

interface RainfallChartProps {
  height?: number
}

export default function RainfallChart({ height = 150 }: RainfallChartProps) {
  const { historicalData } = useWeatherData()
  const chartRef = useRef<ChartJS>(null)

  useEffect(() => {
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy()
      }
    }
  }, [])

  const last24Hours = historicalData.slice(-24)

  const data = {
    labels: last24Hours.map((item) => format(new Date(item.timestamp), "HH:mm:ss")),
    datasets: [
      {
        label: "Curah Hujan (mm/jam)",
        data: last24Hours.map((item) => item.rainfall),
        backgroundColor: "rgba(59, 130, 246, 0.6)",
        borderColor: "rgba(59, 130, 246, 1)",
        borderWidth: 1,
      },
    ],
  }

  const options: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: "index",
        intersect: false,
        callbacks: {
          title: (context) => {
            if (context[0].label) {
              // Cari data asli berdasarkan indeks
              const dataIndex = context[0].dataIndex;
              if (dataIndex !== undefined && last24Hours[dataIndex]) {
                // Format timestamp lengkap
                return format(new Date(last24Hours[dataIndex].timestamp), "dd MMM yyyy HH:mm:ss");
              }
            }
            return context[0].label || '';
          }
        }
      },
      title: {
        display: false,
      },
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: false,
        },
        ticks: {
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 12,
          font: {
            size: 10,
          },
        },
      },
      y: {
        display: true,
        grid: {
          display: true,
        },
        min: 0,
        ticks: {
          precision: 1,
          font: {
            size: 10,
          },
        },
      },
    },
    interaction: {
      mode: "nearest",
      axis: "x",
      intersect: false,
    },
  }

  return (
    <div style={{ height: `${height}px` }}>
      <Bar data={data} options={options} />
    </div>
  )
}
