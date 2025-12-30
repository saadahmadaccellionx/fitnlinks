import { PlaylistView } from "@/components/playlist-view";
import { OpenAppButton } from "@/components/open-app-button";
import type { Metadata } from "next";

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';
export const dynamicParams = true;


interface PageProps {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    page?: string;
    limit?: string;
    bgColor?: string;
  }>;
}

// Generate metadata for Open Graph and App Links
export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const { bgColor } = await searchParams;
  // Use ngrok URL as default to match the app's sharing URL
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://luann-proptosed-circularly.ngrok-free.dev';
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
  
  let playlistData = null;
  
  try {
    // Use public route for metadata generation
    const response = await fetch(`${backendUrl}/api/v1/playlists/public/${id}`, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const result = await response.json();
      playlistData = result.data;
    }
  } catch (error) {
    console.error('Error fetching playlist for metadata:', error);
  }

  // Build playlist URL with bgColor parameter if provided
  const playlistUrl = bgColor 
    ? `${baseUrl}/playlists/${id}?bgColor=${encodeURIComponent(bgColor)}`
    : `${baseUrl}/playlists/${id}`;
  const deepLink = `myapp://PlaylistDetail?id=${id}`;
  
  // Default metadata
  const title = playlistData?.name || 'FITN Playlist';
  const description = playlistData 
    ? `Playlist by ${playlistData.owner?.name || playlistData.owner?.username || 'Unknown'} • ${playlistData.videoCount || 0} videos`
    : 'Explore fitness and lifestyle content on FITN';
  
  // Build OG image URL with bgColor parameter
  const ogImageUrl = bgColor
    ? `${baseUrl}/api/og/playlist/${id}?bgColor=${encodeURIComponent(bgColor)}`
    : `${baseUrl}/api/og/playlist/${id}`;
  
  // Build fallback image URLs (ensure all are absolute)
  const playlistImageUrl = playlistData?.imageUrl 
    ? (playlistData.imageUrl.startsWith('http') 
        ? playlistData.imageUrl 
        : playlistData.imageUrl.startsWith('/')
          ? `${baseUrl}${playlistData.imageUrl}`
          : `${backendUrl}${playlistData.imageUrl}`)
    : null;
  
  const defaultIconUrl = `${baseUrl}/icon-light-32x32.png`;
  
  // Create image array with fallback chain: OG image → Playlist image → Default icon
  const ogImages = [
    {
      url: ogImageUrl,
      width: 1200,
      height: 630,
      alt: title,
      type: 'image/png' as const,
    },
  ];
  
  // Add playlist image as fallback if available
  if (playlistImageUrl) {
    ogImages.push({
      url: playlistImageUrl,
      width: 1200,
      height: 630,
      alt: title,
      type: 'image/jpeg' as const,
    });
  }
  
  // Add default icon as final fallback
  ogImages.push({
    url: defaultIconUrl,
    width: 32,
    height: 32,
    alt: 'FITN',
    type: 'image/png' as const,
  });

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: playlistUrl,
      siteName: 'FITN',
      images: ogImages,
      type: 'music.playlist',
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ogImages.length > 0 ? [ogImages[0].url] : [defaultIconUrl],
    },
    alternates: {
      canonical: playlistUrl,
    },
    other: {
      'al:ios:url': deepLink,
      'al:ios:app_store_id': '1660781140',
      'al:ios:app_name': 'FITN',
      'al:android:url': deepLink,
      'al:android:package': 'com.georgefitnlifestyle.fitn',
      'al:android:app_name': 'FITN',
      'al:web:url': playlistUrl,
    },
  };
}

export default async function PlaylistPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { page = '1', limit = '12' } = await searchParams;

  let playlistData = null;
  let error = null;

  try {
    // Use public route for public sharing page (no authentication required)
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    const url = `${backendUrl}/api/v1/playlists/public/${id}`;

    console.log('Fetching playlist from:', url);

    const response = await fetch(url, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const statusText = response.statusText || `HTTP ${response.status}`;
      let errorData: any = null;
      let responseBody = '';
      
      try {
        responseBody = await response.text();
        if (responseBody) {
          try {
            errorData = JSON.parse(responseBody);
          } catch (e) {
            // Response body exists but is not valid JSON
            errorData = { rawBody: responseBody };
          }
        }
      } catch (e) {
        // Failed to read response body
        errorData = null;
      }
      
      error = errorData?.error || errorData?.message || `Failed to load playlist: ${statusText}`;
      
      // Log error details only if there's meaningful information
      if (errorData && Object.keys(errorData).length > 0) {
        console.error(`Playlist fetch failed [${response.status} ${statusText}]:`, errorData);
      } else if (responseBody) {
        console.error(`Playlist fetch failed [${response.status} ${statusText}]:`, { body: responseBody });
      } else {
        console.error(`Playlist fetch failed [${response.status} ${statusText}]: No response body`);
      }
    } else {
      const result = await response.json();
      // Transform public route response to match expected format
      // Public route returns { message, data } where data doesn't include videos
      playlistData = {
        ...result,
        data: {
          ...result.data,
          videos: [], // Public route doesn't return videos
        },
        pagination: {
          totalPages: 0,
          page: 1,
          limit: 12,
        },
      };
    }
  } catch (err: any) {
    console.error('Error fetching playlist:', err);
    const errorMessage = err.message || 'Unknown error';
    const isConnectionError = errorMessage.includes('fetch failed') || 
                              errorMessage.includes('ECONNREFUSED') ||
                              errorMessage.includes('Failed to fetch');
    
    if (isConnectionError) {
      error = `Cannot connect to backend server at ${process.env.BACKEND_URL || 'http://localhost:5000'}. Please ensure the Express backend is running.`;
    } else {
      error = `Failed to load playlist: ${errorMessage}`;
    }
  }

  return (
    <>
      <div className="sticky top-0 z-40 bg-black/80 backdrop-blur-sm border-b border-[#353539]">
        <div className="max-w-md mx-auto px-4 py-4 flex justify-end">
          <OpenAppButton playlistId={id} variant="default" size="sm" className="bg-[#24FF96] text-black hover:bg-[#24FF96]/90" />
        </div>
      </div>
      <PlaylistView playlistData={playlistData} error={error} playlistId={id} />
    </>
  );
}

