"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { VideoThumbnail } from "./video-thumbnail"
import { OpenAppButton } from "./open-app-button"
import Image from "next/image"
import { useOpenApp } from "@/hooks/use-open-app"
import { useState, useEffect } from "react"

interface Video {
  _id: string
  name?: string
  caption?: string
  thumbnailUrl?: string
  viewCount?: number
  owner?: {
    username?: string
    name?: string
  }
  isPinned?: boolean
}

interface PlaylistData {
  message?: string
  data?: {
    _id: string
    name: string
    imageUrl?: string
    videos: Video[]
    owner?: {
      username?: string
      name?: string
    }
  }
  isOwner?: boolean
  pagination?: {
    totalPages: number
    page: number
    limit: number
  }
}

interface PlaylistViewProps {
  playlistData: PlaylistData | null
  error: string | null
  playlistId?: string
}

export function PlaylistView({ playlistData, error, playlistId }: PlaylistViewProps) {
  const loading = playlistData === null && error === null
  const displayPlaylistId = playlistId || playlistData?.data?._id || ""
  const { detectDevice, openDeepLink, openAppStore } = useOpenApp()
  const [device, setDevice] = useState<"ios" | "android" | "desktop">("desktop")

  useEffect(() => {
    setDevice(detectDevice())
  }, [detectDevice])

  // Limit to 6 videos
  const displayVideos = playlistData?.data?.videos?.slice(0, 6) || []

  const handleHeaderClick = () => {
    if (displayPlaylistId) {
      if (device === "desktop") {
        openAppStore("ios")
      } else {
        openDeepLink(displayPlaylistId)
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <div className="max-w-md mx-auto">
          <div className="relative">
            <Skeleton className="w-full h-[400px] bg-[#161618]" />
            <div className="absolute bottom-0 left-0 right-0 p-6 space-y-4">
              <Skeleton className="h-8 w-3/4 bg-[#353539]" />
              <Skeleton className="h-6 w-1/2 bg-[#353539]" />
            </div>
          </div>
          <div className="p-4 md:p-6 lg:p-8">
            <div className="grid grid-cols-3 gap-2">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="aspect-[4/5] rounded-lg bg-[#161618]" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black p-4 md:p-8 lg:p-12 flex items-center justify-center">
        <div className="max-w-md w-full mx-auto">
          <Alert variant="destructive" className="bg-[#161618] border-[#353539]">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-white">{error}</AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  if (!playlistData?.data) {
    return (
      <div className="min-h-screen bg-black p-4 md:p-8 lg:p-12 flex items-center justify-center">
        <div className="max-w-md w-full mx-auto">
          <Alert className="bg-[#161618] border-[#353539]">
            <AlertCircle className="h-4 w-4 text-white" />
            <AlertDescription className="text-white">Playlist not found</AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  const { data } = playlistData
  const playlistName = data.name || "Untitled Playlist"
  const username = data.owner?.username || data.owner?.name || "Unknown"
  const backgroundImage = data.imageUrl

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-md mx-auto">
        {/* Header Section with Background Image */}
        <button
          onClick={handleHeaderClick}
          className="relative w-full h-[400px] md:h-[500px] overflow-hidden cursor-pointer transition-opacity hover:opacity-95 active:opacity-90"
          type="button"
        >
        {backgroundImage && (
          <Image
            src={backgroundImage}
            alt={playlistName}
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
        )}
        
        {/* Top Gradient Overlay - 15% height */}
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black via-black/60 to-transparent" 
             style={{ height: '15%' }} />
        
        {/* Bottom Gradient Overlay - 200px height */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/90 to-transparent" 
             style={{ height: '200px' }} />
        
        {/* Content Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 pb-8 z-10">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-semibold text-white mb-2 text-center">
            {playlistName}
          </h1>
          <div className="flex items-center justify-center gap-1">
            <span className="text-white text-base md:text-lg">by</span>
            <span className="text-[#24FF96] text-base md:text-lg font-semibold">
              @{username}
            </span>
          </div>
        </div>
        </button>

        {/* Video Grid Section */}
        <div className="p-4 md:p-6 lg:p-8">
        {displayVideos.length > 0 ? (
          <>
            <div className="grid grid-cols-3 gap-2 md:gap-3 mb-6">
              {displayVideos.map((video) => (
                <VideoThumbnail
                  key={video._id}
                  thumbnailUrl={video.thumbnailUrl}
                  viewCount={video.viewCount || 0}
                  playlistId={displayPlaylistId}
                />
              ))}
            </div>

            {/* View All Button */}
            {(playlistData.pagination?.totalPages > 0 || (data.videos?.length || 0) > 6) && (
              <div className="flex justify-center mt-6">
                <OpenAppButton 
                  playlistId={displayPlaylistId} 
                  variant="default"
                  size="lg"
                  className="bg-[#24FF96] text-black hover:bg-[#24FF96]/90 font-medium px-8 py-6 text-base"
                />
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-[#A8A7AD] text-lg">No videos in this playlist</p>
          </div>
        )}
        </div>
      </div>
    </div>
  )
}
