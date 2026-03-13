"use client"

import * as React from "react"
import { Moon, Sun, Monitor } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function ThemeToggle() {
  const { setTheme, theme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-[12px] hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="rounded-2xl border-gray-200 dark:border-zinc-800 shadow-xl p-1 w-36">
        <DropdownMenuItem 
          onClick={() => setTheme("light")}
          className="rounded-xl gap-2 cursor-pointer focus:bg-blue-50 dark:focus:bg-blue-900/20 focus:text-blue-600"
        >
          <Sun className="h-4 w-4" />
          <span className="font-medium">Light</span>
          {theme === "light" && <div className="ml-auto w-1 h-1 rounded-full bg-blue-600" />}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme("dark")}
          className="rounded-xl gap-2 cursor-pointer focus:bg-blue-50 dark:focus:bg-blue-900/20 focus:text-blue-600"
        >
          <Moon className="h-4 w-4" />
          <span className="font-medium">Dark</span>
          {theme === "dark" && <div className="ml-auto w-1 h-1 rounded-full bg-blue-600" />}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme("system")}
          className="rounded-xl gap-2 cursor-pointer focus:bg-blue-50 dark:focus:bg-blue-900/20 focus:text-blue-600"
        >
          <Monitor className="h-4 w-4" />
          <span className="font-medium">System</span>
          {theme === "system" && <div className="ml-auto w-1 h-1 rounded-full bg-blue-600" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
