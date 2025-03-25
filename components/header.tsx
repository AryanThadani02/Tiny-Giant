"use client"

import { Button } from "@/components/ui/button"
import { Settings } from "lucide-react"

export function Header() {
  return (
    <header className="border-b bg-white sticky top-0 z-10 shadow-sm">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">Tiny Giant</h2>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="rounded-full h-9 w-9">
            <Settings className="h-5 w-5 text-gray-600" />
          </Button>
        </div>
      </div>
    </header>
  )
}

