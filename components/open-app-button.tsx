"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useOpenApp } from "@/hooks/use-open-app"
import { Smartphone, Apple, Smartphone as Android } from "lucide-react"
import { cn } from "@/lib/utils"

interface OpenAppButtonProps {
  playlistId: string
  variant?: "default" | "outline" | "ghost" | "secondary"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
  isFloating?: boolean
}

export function OpenAppButton({
  playlistId,
  variant = "default",
  size = "default",
  className,
  isFloating = false,
}: OpenAppButtonProps) {
  const { detectDevice, openDeepLink, openAppStore } = useOpenApp()
  const device = detectDevice()

  const handleClick = () => {
    // On mobile, try deep link first
    openDeepLink(playlistId)
  }

  const handleIOSClick = () => {
    openAppStore("ios")
  }

  const handleAndroidClick = () => {
    openAppStore("android")
  }

  // On desktop, show dropdown with both options
  if (device === "desktop") {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant={variant}
            size={size}
            className={cn(
              "gap-2",
              isFloating && "fixed bottom-6 right-6 z-50 shadow-lg rounded-full",
              className
            )}
          >
            <Smartphone className="h-4 w-4" />
            <span>open app</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleIOSClick}>
            <Apple className="h-4 w-4 mr-2" />
            Get App for iOS
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleAndroidClick}>
            <Android className="h-4 w-4 mr-2" />
            Get App for Android
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  // On mobile, direct button that opens deep link
  return (
    <Button
      onClick={handleClick}
      variant={variant}
      size={size}
      className={cn(
        "gap-2",
        isFloating && "fixed bottom-6 right-6 z-50 shadow-lg rounded-full",
        className
      )}
    >
      <Smartphone className="h-4 w-4" />
      <span>open app</span>
    </Button>
  )
}

