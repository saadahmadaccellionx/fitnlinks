"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Music, Play, Pause, Clock, Disc3, AlertCircle } from "lucide-react"
import { OpenAppButton } from "@/components/open-app-button"

interface Video {
  _id: string
  name?: string
  caption?: string
  thumbnailUrl?: string
  owner?: {
    username?: string
    name?: string
  }
  isPinned?: boolean
  tags?: string[]
  category?: {
    name?: string
  }
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

interface Track {
  id: string
  title: string
  artist: string
  album: string
  duration: string
  genre: string
}

interface Playlist {
  id: string
  name: string
  description: string
  cover: string
  tracks: Track[]
  totalDuration: string
}

interface PlaylistViewProps {
  playlistData: PlaylistData | null
  error: string | null
  playlistId?: string
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function calculateTotalDuration(tracks: Track[]): string {
  // Since we don't have actual duration, we'll estimate based on average video length
  // Assuming average video is ~3-4 minutes
  const totalMinutes = tracks.length * 3.5
  const hours = Math.floor(totalMinutes / 60)
  const minutes = Math.floor(totalMinutes % 60)
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}

function transformPlaylistData(playlistData: PlaylistData | null): Playlist | null {
  if (!playlistData?.data) {
    return null
  }

  const { data } = playlistData
  const videos = data.videos || []

  const tracks: Track[] = videos.map((video, index) => {
    const title = video.name || video.caption || `Video ${index + 1}`
    const artist = video.owner?.username || video.owner?.name || "Unknown Artist"
    const album = data.name || "Unknown Album"
    const genre = video.category?.name || video.tags?.[0] || "Uncategorized"
    // Default duration since video model doesn't have duration field
    const duration = "3:45"

    return {
      id: video._id,
      title,
      artist,
      album,
      duration,
      genre,
    }
  })

  return {
    id: data._id,
    name: data.name || "Untitled Playlist",
    description: `Playlist by ${data.owner?.username || data.owner?.name || "Unknown"}`,
    cover: data.imageUrl || "/placeholder.svg",
    tracks,
    totalDuration: calculateTotalDuration(tracks),
  }
}

export function PlaylistView({ playlistData, error, playlistId }: PlaylistViewProps) {
  const [playingId, setPlayingId] = useState<string | null>(null)

  const loading = playlistData === null && error === null
  const playlist = transformPlaylistData(playlistData)
  const displayPlaylistId = playlistId || playlist?.id || ""

  const togglePlay = (id: string) => {
    setPlayingId(playingId === id ? null : id)
  }

  if (loading) {
    return (
      <div className="min-h-screen p-4 md:p-8 lg:p-12">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex flex-col md:flex-row gap-8">
            <Skeleton className="w-full md:w-80 h-80 rounded-xl" />
            <div className="flex-1 space-y-4">
              <Skeleton className="h-12 w-3/4" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-1/2" />
            </div>
          </div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen p-4 md:p-8 lg:p-12">
        <div className="max-w-7xl mx-auto">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  if (!playlist) {
    return (
      <div className="min-h-screen p-4 md:p-8 lg:p-12">
        <div className="max-w-7xl mx-auto">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Playlist not found</AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 md:p-8 lg:p-12">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Playlist Header */}
        <div className="flex flex-col md:flex-row gap-6 md:gap-8">
          <div className="relative group w-full md:w-80 h-80 flex-shrink-0">
            <img
              src={playlist.cover || "/placeholder.svg"}
              alt={playlist.name}
              className="w-full h-full object-cover rounded-xl shadow-2xl"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>

          <div className="flex flex-col justify-end space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Music className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium text-primary">{"PLAYLIST"}</span>
              </div>
              {displayPlaylistId && (
                <OpenAppButton playlistId={displayPlaylistId} variant="outline" size="sm" />
              )}
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-balance">{playlist.name}</h1>

            <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl text-pretty">
              {playlist.description}
            </p>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Disc3 className="w-4 h-4" />
                {playlist.tracks.length} tracks
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                {playlist.totalDuration}
              </span>
            </div>
          </div>
        </div>

        {/* Track List */}
        <Card className="overflow-hidden border-border bg-card/50 backdrop-blur-sm">
          <div className="divide-y divide-border">
            {/* Header */}
            <div className="grid grid-cols-[auto_1fr_auto_auto] md:grid-cols-[auto_2fr_1.5fr_1fr_auto_auto] gap-4 px-4 md:px-6 py-3 text-sm font-medium text-muted-foreground">
              <span className="w-8">#</span>
              <span>{"Title"}</span>
              <span className="hidden md:block">{"Album"}</span>
              <span className="hidden md:block">{"Genre"}</span>
              <span className="hidden md:block">
                <Clock className="w-4 h-4" />
              </span>
              <span className="w-10" />
            </div>

            {/* Tracks */}
            {playlist.tracks.map((track, index) => (
              <div
                key={track.id}
                className="grid grid-cols-[auto_1fr_auto_auto] md:grid-cols-[auto_2fr_1.5fr_1fr_auto_auto] gap-4 px-4 md:px-6 py-4 hover:bg-muted/50 transition-colors group"
              >
                <span className="w-8 text-muted-foreground text-sm flex items-center">
                  {playingId === track.id ? (
                    <span className="flex gap-0.5">
                      <span className="w-0.5 h-4 bg-primary animate-pulse" style={{ animationDelay: "0ms" }} />
                      <span className="w-0.5 h-4 bg-primary animate-pulse" style={{ animationDelay: "150ms" }} />
                      <span className="w-0.5 h-4 bg-primary animate-pulse" style={{ animationDelay: "300ms" }} />
                    </span>
                  ) : (
                    index + 1
                  )}
                </span>

                <div className="min-w-0">
                  <div
                    className={`font-medium truncate ${playingId === track.id ? "text-primary" : "text-foreground"}`}
                  >
                    {track.title}
                  </div>
                  <div className="text-sm text-muted-foreground truncate">{track.artist}</div>
                </div>

                <div className="hidden md:flex items-center text-sm text-muted-foreground truncate">{track.album}</div>

                <div className="hidden md:flex items-center">
                  <Badge variant="secondary" className="text-xs">
                    {track.genre}
                  </Badge>
                </div>

                <div className="hidden md:flex items-center text-sm text-muted-foreground tabular-nums">
                  {track.duration}
                </div>

                <div className="flex items-center justify-end w-10">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => togglePlay(track.id)}
                  >
                    {playingId === track.id ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
      {displayPlaylistId && (
        <OpenAppButton playlistId={displayPlaylistId} isFloating={true} />
      )}
    </div>
  )
}
