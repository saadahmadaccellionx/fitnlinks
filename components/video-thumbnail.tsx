"use client"

import Image from "next/image"
import { Play } from "lucide-react"
import { useOpenApp } from "@/hooks/use-open-app"
import { useState, useEffect } from "react"

function formatViewCount(count: number): string {
  if (count >= 1000000) {
    return (count / 1000000).toFixed(1).replace(/\.0$/, '') + 'M'
  }
  if (count >= 1000) {
    return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'K'
  }
  return count.toString()
}

interface VideoThumbnailProps {
  thumbnailUrl?: string
  viewCount?: number
  className?: string
  playlistId?: string
  onClick?: () => void
}

export function VideoThumbnail({ thumbnailUrl, viewCount = 0, className, playlistId, onClick }: VideoThumbnailProps) {
  const { detectDevice, openDeepLink, openAppStore } = useOpenApp()
  const [device, setDevice] = useState<"ios" | "android" | "desktop">("desktop")

  useEffect(() => {
    setDevice(detectDevice())
  }, [detectDevice])

  const handleClick = () => {
    if (onClick) {
      onClick()
      return
    }
    
    if (playlistId) {
      if (device === "desktop") {
        // On desktop, open app store
        openAppStore("ios") // Default to iOS, user can choose
      } else {
        // On mobile, open deep link
        openDeepLink(playlistId)
      }
    }
  }

  return (
    <button
      onClick={handleClick}
      className={`relative aspect-[4/5] rounded-lg overflow-hidden bg-[#161618] cursor-pointer transition-opacity hover:opacity-90 active:opacity-80 ${className}`}
      type="button"
    >
      {thumbnailUrl ? (
        <Image
          src={thumbnailUrl}
          alt="Video thumbnail"
          fill
          className="object-cover"
          sizes="(max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
        />
      ) : (
        <div className="w-full h-full bg-[#161618] flex items-center justify-center">
          <Play className="w-8 h-8 text-[#A8A7AD]" />
        </div>
      )}
      
      {/* Gradient overlay at bottom */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      
      {/* Play icon and view count overlay */}
      <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
        <Play className="w-4 h-4 text-white fill-white" />
        <span className="text-white text-xs font-medium">
          {formatViewCount(viewCount)}
        </span>
      </div>
    </button>
  )
}

