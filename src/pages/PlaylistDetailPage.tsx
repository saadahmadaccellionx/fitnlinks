import { useEffect, useState } from "react"
import { useParams, useSearchParams } from "react-router-dom"
import { Helmet } from "react-helmet-async"
import { PlaylistView } from "@/components/playlist-view"
import { OpenAppButton } from "@/components/open-app-button"

interface PlaylistData {
  message?: string
  data?: {
    _id: string
    name: string
    imageUrl?: string
    videos: any[]
    owner?: {
      username?: string
      name?: string
    }
    videoCount?: number
  }
  isOwner?: boolean
  pagination?: {
    totalPages: number
    page: number
    limit: number
  }
}

export default function PlaylistDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const bgColor = searchParams.get('bgColor')
  const [playlistData, setPlaylistData] = useState<PlaylistData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [metadata, setMetadata] = useState({
    title: 'FITN Playlist',
    description: 'Explore fitness and lifestyle content on FITN',
    ogImageUrl: '',
    playlistImageUrl: null as string | null,
  })

  // Use relative URL when proxying through Vite, or full URL for production
  const backendUrl = (import.meta.env?.VITE_BACKEND_URL as string) || 'https://luann-proptosed-circularly.ngrok-free.dev'
  const baseUrl = (import.meta.env?.VITE_BASE_URL as string) || 'https://fitn.expo.app'
  const facebookAppId = (import.meta.env?.VITE_FACEBOOK_APP_ID as string) || '923362986389142'

  useEffect(() => {
    if (!id) return

    const fetchPlaylist = async () => {
      try {
        const url = backendUrl ? `${backendUrl}/api/v1/playlists/public/${id}` : `/api/v1/playlists/public/${id}`

        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        }
        
        // Add ngrok skip browser warning header if using ngrok URL
        if (backendUrl && backendUrl.includes('ngrok')) {
          headers['ngrok-skip-browser-warning'] = 'true'
        }

        const response = await fetch(url, { headers })

        if (!response.ok) {
          const statusText = response.statusText || `HTTP ${response.status}`
          let errorData: any = null
          let responseBody = ''

          try {
            responseBody = await response.text()
            if (responseBody) {
              // Check if response is HTML (starts with <!doctype or <html)
              if (responseBody.trim().toLowerCase().startsWith('<!doctype') || responseBody.trim().toLowerCase().startsWith('<html')) {
                errorData = { message: 'Received HTML instead of JSON. This might be a redirect or error page.' }
              } else {
                try {
                  errorData = JSON.parse(responseBody)
                } catch (e) {
                  errorData = { rawBody: responseBody }
                }
              }
            }
          } catch (e) {
            errorData = null
          }

          setError(errorData?.error || errorData?.message || `Failed to load playlist: ${statusText}`)
        } else {
          // Read response as text first to check if it's HTML
          const responseText = await response.text()
          
          // Check if response is HTML (starts with <!doctype or <html)
          if (responseText.trim().toLowerCase().startsWith('<!doctype') || responseText.trim().toLowerCase().startsWith('<html')) {
            setError('Received HTML instead of JSON. The backend might be returning an error page or ngrok warning.')
            console.error('Received HTML response:', responseText.substring(0, 200))
            return
          }
          
          // Try to parse as JSON
          let result: any
          try {
            result = JSON.parse(responseText)
          } catch (e) {
            setError('Invalid JSON response from server')
            console.error('Failed to parse JSON:', responseText.substring(0, 200))
            return
          }
          const data = {
            ...result,
            data: {
              ...result.data,
              videos: [],
            },
            pagination: {
              totalPages: 0,
              page: 1,
              limit: 12,
            },
          }
          setPlaylistData(data)

          // Update metadata
          const title = result.data?.name || 'FITN Playlist'
          const description = result.data
            ? `Playlist by ${result.data.owner?.name || result.data.owner?.username || 'Unknown'} • ${result.data.videoCount || 0} videos`
            : 'Explore fitness and lifestyle content on FITN'

          // Prioritize playlist cover image
          let playlistImageUrl: string | null = null
          if (result.data?.imageUrl) {
            playlistImageUrl = result.data.imageUrl.startsWith('http')
              ? result.data.imageUrl
              : result.data.imageUrl.startsWith('/')
                ? `${baseUrl}${result.data.imageUrl}`
                : backendUrl ? `${backendUrl}${result.data.imageUrl}` : result.data.imageUrl
          }

          // Fallback to generated OG image if no playlist cover
          const ogImageUrl = bgColor
            ? `${baseUrl}/api/v1/og/playlist/${id}?bgColor=${encodeURIComponent(bgColor)}`
            : `${baseUrl}/api/v1/og/playlist/${id}`

          setMetadata({
            title,
            description,
            ogImageUrl,
            playlistImageUrl,
          })
        }
      } catch (err: any) {
        const errorMessage = err.message || 'Unknown error'
        const isConnectionError = errorMessage.includes('fetch failed') ||
          errorMessage.includes('ECONNREFUSED') ||
          errorMessage.includes('Failed to fetch')

        if (isConnectionError) {
          setError(`Cannot connect to backend server at ${backendUrl}. Please ensure the Express backend is running.`)
        } else {
          setError(`Failed to load playlist: ${errorMessage}`)
        }
      }
    }

    fetchPlaylist()
  }, [id, bgColor, backendUrl, baseUrl])

  const playlistUrl = bgColor
    ? `${baseUrl}/PlaylistDetail/${id}?bgColor=${encodeURIComponent(bgColor)}`
    : `${baseUrl}/PlaylistDetail/${id}`
  const deepLink = `myapp://PlaylistDetail?id=${id}`
  const defaultIconUrl = `${baseUrl}/icon-light-32x32.png`

  return (
    <>
      <Helmet>
        <title>{metadata.title}</title>
        <meta name="description" content={metadata.description} />
        <meta property="og:title" content={metadata.title} />
        <meta property="og:description" content={metadata.description} />
        <meta property="og:url" content={playlistUrl} />
        <meta property="og:site_name" content="FITN" />
        <meta property="og:image" content={metadata.playlistImageUrl || metadata.ogImageUrl || defaultIconUrl} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:type" content="music.playlist" />
        <meta property="og:locale" content="en_US" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={metadata.title} />
        <meta name="twitter:description" content={metadata.description} />
        <meta name="twitter:image" content={metadata.playlistImageUrl || metadata.ogImageUrl || defaultIconUrl} />
        <link rel="canonical" href={playlistUrl} />
        <meta property="fb:app_id" content={facebookAppId} />
        <meta property="al:ios:url" content={deepLink} />
        <meta property="al:ios:app_store_id" content="1660781140" />
        <meta property="al:ios:app_name" content="FITN" />
        <meta property="al:android:url" content={deepLink} />
        <meta property="al:android:package" content="com.georgefitnlifestyle.fitn" />
        <meta property="al:android:app_name" content="FITN" />
        <meta property="al:web:url" content={playlistUrl} />
      </Helmet>
      <div className="sticky top-0 z-40 bg-black/80 backdrop-blur-sm border-b border-[#353539]">
        <div className="max-w-md mx-auto px-4 py-4 flex justify-end">
          <OpenAppButton playlistId={id || ''} variant="default" size="sm" className="bg-[#24FF96] text-black hover:bg-[#24FF96]/90" />
        </div>
      </div>
      <PlaylistView playlistData={playlistData} error={error} playlistId={id} />
    </>
  )
}

