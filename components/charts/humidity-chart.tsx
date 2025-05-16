"use client"

import { useEffect, useRef } from "react"
import { useWeatherData } from "@/context/weather-data-context"
import { Line } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  type ChartOptions,
} from "chart.js"
import { format } from "date-fns"

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

interface HumidityChartProps {
  height?: number
}

export default function HumidityChart({ height = 150 }: HumidityChartProps) {
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
    labels: last24Hours.map((item) => format(new Date(item.timestamp), "HH:mm")),
    datasets: [
      {
        label: "Kelembapan (%)",
        data: last24Hours.map((item) => item.humidity),
        borderColor: "#0891b2",
        backgroundColor: "rgba(8, 145, 178, 0.1)",
        borderWidth: 2,
        pointRadius: 1,
        tension: 0.3,
        fill: true,
      },
    ],
  }

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: "index",
        intersect: false,
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
          maxTicksLimit: 6,
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
        max: 100,
        ticks: {
          precision: 0,
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
      <Line data={data} options={options} />
    </div>
  )
}
