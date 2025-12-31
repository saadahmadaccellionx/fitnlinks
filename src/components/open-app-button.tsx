import { useState, useEffect } from "react"
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
  buttonText?: string
}

export function OpenAppButton({
  playlistId,
  variant = "default",
  size = "default",
  className,
  isFloating = false,
  buttonText = "open app",
}: OpenAppButtonProps) {
  const { detectDevice, openDeepLink, openAppStore } = useOpenApp()
  // Start with "desktop" to match server-side rendering, then update after hydration
  const [device, setDevice] = useState<"ios" | "android" | "desktop">("desktop")

  useEffect(() => {
    // Only detect device on client side after hydration
    setDevice(detectDevice())
  }, [detectDevice])

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

  // Determine button text based on device
  const getButtonText = () => {
    if (buttonText) return buttonText
    return device === "desktop" ? "Get App" : "Open App"
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
              "gap-2 bg-[#24FF96] text-black hover:bg-[#24FF96]/90",
              isFloating && "fixed bottom-6 right-6 z-50 shadow-lg rounded-full",
              className
            )}
          >
            <Smartphone className="h-4 w-4" />
            <span>{getButtonText()}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-[#161618] border-[#353539]">
          <DropdownMenuItem onClick={handleIOSClick} className="text-white hover:bg-[#353539]">
            <Apple className="h-4 w-4 mr-2" />
            Get App for iOS
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleAndroidClick} className="text-white hover:bg-[#353539]">
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
        "gap-2 bg-[#24FF96] text-black hover:bg-[#24FF96]/90",
        isFloating && "fixed bottom-6 right-6 z-50 shadow-lg rounded-full",
        className
      )}
    >
      <Smartphone className="h-4 w-4" />
      <span>{getButtonText()}</span>
    </Button>
  )
}

