import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import Header from "@/components/header"
import Footer from "@/components/footer"
import { WeatherDataProvider } from "@/context/weather-data-context"
import { MqttProvider } from "@/context/mqtt-context"
import { AdminProvider } from "@/context/admin-context"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "AWS Monitoring - TNI AU",
  description: "Website Monitoring Automatic Weather Station (AWS) untuk Mendukung Operasional Penerbangan TNI AU",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <AdminProvider>
            <WeatherDataProvider>
              <MqttProvider>
                <div className="flex min-h-screen flex-col">
                  <Header />
                  <main className="flex-1">{children}</main>
                  <Footer />
                </div>
              </MqttProvider>
            </WeatherDataProvider>
          </AdminProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
