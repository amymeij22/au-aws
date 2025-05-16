import { BarChart3, Database, History, Settings, Users } from "lucide-react"

export const adminNavItems = [
  {
    href: "/admin",
    title: "Dashboard",
    icon: <BarChart3 className="h-5 w-5" />,
  },
  {
    href: "/admin/admins",
    title: "Pengelolaan Admin",
    icon: <Users className="h-5 w-5" />,
  },
  {
    href: "/admin/stations",
    title: "Metadata Stasiun",
    icon: <Database className="h-5 w-5" />,
  },
  {
    href: "/admin/mqtt",
    title: "Konfigurasi MQTT",
    icon: <Settings className="h-5 w-5" />,
  },
  {
    href: "/admin/history",
    title: "Data Historis",
    icon: <History className="h-5 w-5" />,
  },
]
