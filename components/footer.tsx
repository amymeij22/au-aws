"use client"

export default function Footer() {
  return (
    <footer className="border-t bg-background h-16 w-full z-40">
      <div className="container flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} TNI AU. All rights reserved.</p>
      </div>
    </footer>
  )
}
