"use client"

import { useEffect, useRef } from "react"
import { useWeatherData } from "@/context/weather-data-context"

interface WindCompassProps {
  direction: number
  speed?: number
  showSpeed?: boolean
  noDataMessage?: boolean
}

export default function WindCompass({ 
  direction, 
  speed = 0, 
  showSpeed = false, 
  noDataMessage = true 
}: WindCompassProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { currentData } = useWeatherData()
  
  // Periksa apakah tidak ada data cuaca dan direction adalah 0
  // Ini akan menandakan bahwa belum ada data yang dikirimkan
  const isNoData = noDataMessage && currentData === null && direction === 0

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height
    const centerX = width / 2
    const centerY = height / 2
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height)
    
    // Jika tidak ada data, tampilkan teks informasi dan hentikan rendering kompas
    if (isNoData) {
      ctx.font = "bold 14px sans-serif"
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      
      // Get muted foreground color
      const mutedColor = getComputedStyle(document.documentElement).getPropertyValue("--muted-foreground").trim()
      ctx.fillStyle = `hsl(${mutedColor})`
      
      ctx.fillText("Belum ada data", centerX, centerY)
      return
    }
    
    const radius = Math.min(width, height) / 2 - 20

    // Get theme colors
    const foregroundColor = getComputedStyle(document.documentElement).getPropertyValue("--foreground").trim()
    const borderColor = getComputedStyle(document.documentElement).getPropertyValue("--border").trim()
    const primaryColor = getComputedStyle(document.documentElement).getPropertyValue("--primary").trim()
    const mutedColor = getComputedStyle(document.documentElement).getPropertyValue("--muted-foreground").trim()

    // Check if we're in light mode to adjust text colors
    const isLightMode =
      document.documentElement.classList.contains("light") || !document.documentElement.classList.contains("dark")

    // Draw compass outer border
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI)
    ctx.strokeStyle = `hsl(${primaryColor})`
    ctx.lineWidth = 2
    ctx.stroke()

    // Draw cardinal direction lines
    const directions = [0, 45, 90, 135, 180, 225, 270, 315]
    directions.forEach((dir) => {
      const angleRad = (dir - 90) * (Math.PI / 180)
      ctx.beginPath()

      // For cardinal directions (N, E, S, W), draw lines from center to edge
      if (dir % 90 === 0) {
        ctx.moveTo(centerX, centerY)
        ctx.lineTo(centerX + radius * Math.cos(angleRad), centerY + radius * Math.sin(angleRad))
        ctx.strokeStyle = `hsla(${primaryColor}, 0.4)`
        ctx.lineWidth = 1
      } else {
        // For intercardinal directions, draw shorter lines
        const innerRadius = radius * 0.8
        ctx.moveTo(centerX + innerRadius * Math.cos(angleRad), centerY + innerRadius * Math.sin(angleRad))
        ctx.lineTo(centerX + radius * Math.cos(angleRad), centerY + radius * Math.sin(angleRad))
        ctx.strokeStyle = `hsla(${mutedColor}, 0.3)`
        ctx.lineWidth = 0.5
      }

      ctx.stroke()
    })

    // Draw cardinal directions text outside the circle
    ctx.font = "bold 14px sans-serif"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"

    // Use darker text color for light mode to ensure visibility
    const directionTextColor = isLightMode ? "hsl(222.2 84% 4.9%)" : `hsl(${foregroundColor})`
    ctx.fillStyle = directionTextColor

    const textRadius = radius + 15

    // North
    ctx.fillText("N", centerX, centerY - textRadius)
    // East
    ctx.fillText("E", centerX + textRadius, centerY)
    // South
    ctx.fillText("S", centerX, centerY + textRadius)
    // West
    ctx.fillText("W", centerX - textRadius, centerY)

    // Draw intercardinal directions
    ctx.font = "12px sans-serif"
    // Use a darker muted color for light mode
    const intercardinalTextColor = isLightMode ? "hsl(215.4 16.3% 36.9%)" : `hsl(${mutedColor})`
    ctx.fillStyle = intercardinalTextColor

    // Calculate positions for intercardinal directions
    const diagonalOffset = textRadius * 0.7071 // cos(45°) = sin(45°) ≈ 0.7071

    // Northeast
    ctx.fillText("NE", centerX + diagonalOffset, centerY - diagonalOffset)
    // Southeast
    ctx.fillText("SE", centerX + diagonalOffset, centerY + diagonalOffset)
    // Southwest
    ctx.fillText("SW", centerX - diagonalOffset, centerY + diagonalOffset)
    // Northwest
    ctx.fillText("NW", centerX - diagonalOffset, centerY - diagonalOffset)

    // Create speed-based color gradient for arrow
    let arrowColor
    if (speed < 2) {
      arrowColor = "#3b82f6" // Light blue for low speed
    } else if (speed < 5) {
      arrowColor = "#10b981" // Green for moderate speed
    } else if (speed < 10) {
      arrowColor = "#f59e0b" // Yellow/orange for high speed
    } else {
      arrowColor = "#ef4444" // Red for very high speed
    }

    // Draw direction arrow
    const angleRad = (direction - 90) * (Math.PI / 180)
    const arrowLength = radius * 0.85

    // Calculate arrow start point (not from center)
    const arrowStartDistance = radius * 0.3 // Start arrow from 30% of radius from center
    const arrowStartX = centerX + arrowStartDistance * Math.cos(angleRad)
    const arrowStartY = centerY + arrowStartDistance * Math.sin(angleRad)

    // Draw arrow shaft
    ctx.beginPath()
    ctx.moveTo(arrowStartX, arrowStartY)
    ctx.lineTo(centerX + arrowLength * Math.cos(angleRad), centerY + arrowLength * Math.sin(angleRad))
    ctx.strokeStyle = arrowColor
    ctx.lineWidth = 3
    ctx.stroke()

    // Draw arrowhead
    const headLength = 15
    const headWidth = 8
    const angle1 = angleRad - Math.atan(headWidth / headLength)
    const angle2 = angleRad + Math.atan(headWidth / headLength)
    const arrowTip = {
      x: centerX + arrowLength * Math.cos(angleRad),
      y: centerY + arrowLength * Math.sin(angleRad),
    }
    const arrowCorner1 = {
      x: arrowTip.x - headLength * Math.cos(angle1),
      y: arrowTip.y - headLength * Math.sin(angle1),
    }
    const arrowCorner2 = {
      x: arrowTip.x - headLength * Math.cos(angle2),
      y: arrowTip.y - headLength * Math.sin(angle2),
    }

    ctx.beginPath()
    ctx.moveTo(arrowTip.x, arrowTip.y)
    ctx.lineTo(arrowCorner1.x, arrowCorner1.y)
    ctx.lineTo(arrowCorner2.x, arrowCorner2.y)
    ctx.closePath()
    ctx.fillStyle = arrowColor
    ctx.fill()

    // Draw center circle with direction info - larger and transparent
    const centerCircleRadius = radius * 0.35
    ctx.beginPath()
    ctx.arc(centerX, centerY, centerCircleRadius, 0, 2 * Math.PI)
    ctx.fillStyle = `hsla(${primaryColor}, 0.05)`
    ctx.fill()
    ctx.strokeStyle = arrowColor
    ctx.lineWidth = 2
    ctx.stroke()

    // Draw direction degree text in center
    ctx.font = "bold 24px sans-serif"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillStyle = directionTextColor
    ctx.fillText(`${Math.round(direction)}°`, centerX, centerY)

    // Draw speed text if needed
    if (showSpeed) {
      // Draw speed text
      ctx.font = "bold 20px sans-serif"
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillStyle = directionTextColor
      ctx.fillText(`${speed.toFixed(1)}`, centerX, centerY - 30)

      // Draw unit text
      ctx.font = "12px sans-serif"
      ctx.fillText("m/s", centerX, centerY - 10)
    }

    // Draw direction text below the compass
    const directionText = getDirectionText(direction)
    ctx.font = "bold 14px sans-serif"
    ctx.fillStyle = arrowColor
    ctx.fillText(directionText, centerX, centerY + radius + 35)
  }, [direction, speed, showSpeed, isNoData])

  // Helper function to get direction text
  const getDirectionText = (degrees: number) => {
    const directions = [
      "N",
      "NNE",
      "NE",
      "ENE",
      "E",
      "ESE",
      "SE",
      "SSE",
      "S",
      "SSW",
      "SW",
      "WSW",
      "W",
      "WNW",
      "NW",
      "NNW",
    ]
    const index = Math.round(degrees / 22.5) % 16
    return `${directions[index]}`
  }

  return (
    <div className="flex flex-col items-center">
      <canvas ref={canvasRef} width={180} height={180} className="mx-auto" />
    </div>
  )
}
