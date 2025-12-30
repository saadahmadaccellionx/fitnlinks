import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

// Helper function to darken color for gradient
const darkenColor = (hex: string): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '#000000';
  const r = Math.max(0, parseInt(result[1], 16) - 30);
  const g = Math.max(0, parseInt(result[2], 16) - 30);
  const b = Math.max(0, parseInt(result[3], 16) - 30);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};

// Helper function to create informative error image
function createErrorImageResponse(title: string, creator: string, videoCount: number, backgroundColor: string) {
  const bottomColor = darkenColor(backgroundColor);
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: `linear-gradient(to bottom, ${backgroundColor}, ${bottomColor})`,
          padding: '60px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        {/* Placeholder for image */}
        <div
          style={{
            width: '400px',
            height: '400px',
            borderRadius: '12px',
            marginBottom: '40px',
            backgroundColor: '#353539',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '120px',
            color: '#A8A7AD',
          }}
        >
          🎵
        </div>

        {/* Playlist Title */}
        <div
          style={{
            fontSize: '56px',
            fontWeight: '700',
            color: '#FFFFFF',
            textAlign: 'center',
            marginBottom: '20px',
            maxWidth: '900px',
            lineHeight: '1.2',
          }}
        >
          {title}
        </div>

        {/* Creator and Video Count */}
        <div
          style={{
            fontSize: '32px',
            color: '#A8A7AD',
            textAlign: 'center',
            marginBottom: '40px',
          }}
        >
          by {creator} • {videoCount} {videoCount === 1 ? 'video' : 'videos'}
        </div>

        {/* FITN Brand Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            backgroundColor: 'rgba(36, 255, 150, 0.2)',
            padding: '12px 24px',
            borderRadius: '8px',
            border: '2px solid #24FF96',
          }}
        >
          <div
            style={{
              fontSize: '24px',
              fontWeight: '700',
              color: '#24FF96',
            }}
          >
            FITN
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let title = 'FITN Playlist';
  let creator = 'Unknown';
  let videoCount = 0;
  let imageUrl: string | null = null;
  let backgroundColor = '#000000';

  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const bgColor = searchParams.get('bgColor') || '#000000';
    backgroundColor = bgColor.startsWith('#') ? bgColor : `#${bgColor}`;
    
    // Log request for debugging (Instagram crawler detection)
    const userAgent = request.headers.get('user-agent') || '';
    const isInstagramBot = userAgent.includes('facebookexternalhit') || userAgent.includes('Instagram');
    console.log(`[OG Image] Request for playlist ${id}`, {
      userAgent: userAgent.substring(0, 100),
      isInstagramBot,
      bgColor,
      url: request.url,
    });
    
    // Fetch playlist data from backend
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    let playlistData = null;
    
    try {
      console.log(`[OG Image] Fetching playlist data from: ${backendUrl}/api/v1/playlists/public/${id}`);
      
      // Set a reasonable timeout for backend fetch (5 seconds)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${backendUrl}/api/v1/playlists/public/${id}`, {
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (response.ok) {
        const result = await response.json();
        playlistData = result.data;
        console.log(`[OG Image] Playlist data fetched successfully:`, {
          name: playlistData?.name,
          hasImage: !!playlistData?.imageUrl,
          owner: playlistData?.owner?.name,
        });
      } else {
        console.error(`[OG Image] Failed to fetch playlist: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('[OG Image] Error fetching playlist for OG image:', error);
    }

    // Extract playlist data
    title = playlistData?.name || 'FITN Playlist';
    creator = playlistData?.owner?.name || playlistData?.owner?.username || 'Unknown';
    videoCount = playlistData?.videoCount || 0;
    
    // Build image URL with multiple fallbacks
    // The backend transforms S3 → CloudFront automatically, but we need to ensure it's accessible
    if (playlistData?.imageUrl) {
      imageUrl = playlistData.imageUrl;
      
      // Ensure absolute URL
      if (!imageUrl.startsWith('http')) {
        if (imageUrl.startsWith('/')) {
          imageUrl = `${backendUrl}${imageUrl}`;
        } else {
          imageUrl = `${backendUrl}/${imageUrl}`;
        }
      }
      
      console.log(`[OG Image] Image URL constructed:`, {
        original: playlistData.imageUrl,
        final: imageUrl,
        isCloudFront: imageUrl?.includes('cloudfront'),
        isS3: imageUrl?.includes('s3'),
      });
      
      // Verify image is accessible before using it
      // Use HEAD request to check if image exists without downloading
      try {
        console.log(`[OG Image] Verifying image accessibility: ${imageUrl}`);
        const imageCheckController = new AbortController();
        const imageCheckTimeout = setTimeout(() => imageCheckController.abort(), 3000);
        
        const imageResponse = await fetch(imageUrl, {
          method: 'HEAD',
          signal: imageCheckController.signal,
          headers: {
            'User-Agent': 'FITN-OG-Image-Generator/1.0',
          },
        });
        
        clearTimeout(imageCheckTimeout);
        
        if (!imageResponse.ok) {
          console.warn(`[OG Image] Image verification failed: ${imageResponse.status} ${imageResponse.statusText}`);
          imageUrl = null; // Fall back to placeholder
        } else {
          console.log(`[OG Image] ✓ Image verified accessible (${imageResponse.status})`);
          // Add cache-busting query param for newly uploaded images if needed
          // This ensures CloudFront serves the latest version
          const urlObj = new URL(imageUrl);
          if (!urlObj.searchParams.has('v')) {
            urlObj.searchParams.set('v', Date.now().toString());
            imageUrl = urlObj.toString();
          }
        }
      } catch (imageError: any) {
        console.error(`[OG Image] Error verifying image accessibility:`, imageError?.message || imageError);
        // If verification fails, still try to use the image (might be a network issue)
        // But log it for debugging
        if (imageError?.name === 'AbortError') {
          console.warn(`[OG Image] Image verification timeout - proceeding anyway`);
        }
      }
    } else {
      console.warn(`[OG Image] No image URL in playlist data. Will show fallback icon.`);
    }

    const bottomColor = darkenColor(backgroundColor);

    // Generate the image with proper error handling
    try {
      console.log(`[OG Image] Generating image with:`, {
        title,
        creator,
        videoCount,
        hasImageUrl: !!imageUrl,
        backgroundColor,
      });
      
      const imageResponse = new ImageResponse(
        (
          <div
            style={{
              height: '100%',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: `linear-gradient(to bottom, ${backgroundColor}, ${bottomColor})`,
              padding: '60px',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              position: 'relative',
            }}
          >
            {/* Background overlay with bgColor (Spotify-style) */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: `linear-gradient(to bottom, ${backgroundColor}40, ${bottomColor}40)`,
                opacity: 0.3,
              }}
            />
            
            {/* Playlist Cover Image */}
            {imageUrl ? (
              // @ts-ignore - @vercel/og supports img tag
              <img
                src={imageUrl}
                alt={title}
                width={400}
                height={400}
                style={{
                  borderRadius: '12px',
                  marginBottom: '40px',
                  objectFit: 'cover',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                  position: 'relative',
                  zIndex: 1,
                }}
              />
            ) : (
              <div
                style={{
                  width: '400px',
                  height: '400px',
                  borderRadius: '12px',
                  marginBottom: '40px',
                  backgroundColor: '#353539',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '120px',
                  color: '#A8A7AD',
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                🎵
              </div>
            )}

            {/* Playlist Title */}
            <div
              style={{
                fontSize: '56px',
                fontWeight: '700',
                color: '#FFFFFF',
                textAlign: 'center',
                marginBottom: '20px',
                maxWidth: '900px',
                lineHeight: '1.2',
                position: 'relative',
                zIndex: 1,
              }}
            >
              {title}
            </div>

            {/* Creator and Video Count */}
            <div
              style={{
                fontSize: '32px',
                color: '#A8A7AD',
                textAlign: 'center',
                marginBottom: '40px',
                position: 'relative',
                zIndex: 1,
              }}
            >
              by {creator} • {videoCount} {videoCount === 1 ? 'video' : 'videos'}
            </div>

            {/* FITN Brand Badge */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                backgroundColor: 'rgba(36, 255, 150, 0.2)',
                padding: '12px 24px',
                borderRadius: '8px',
                border: '2px solid #24FF96',
                position: 'relative',
                zIndex: 1,
              }}
            >
              <div
                style={{
                  fontSize: '24px',
                  fontWeight: '700',
                  color: '#24FF96',
                }}
              >
                FITN
              </div>
            </div>
          </div>
        ),
        {
          width: 1200,
          height: 630,
        }
      );
      
      console.log(`[OG Image] Image generated successfully`);
      return imageResponse;
    } catch (imageError: any) {
      console.error('[OG Image] Error generating ImageResponse:', imageError);
      console.error('[OG Image] Error details:', {
        message: imageError?.message,
        stack: imageError?.stack,
      });
      // Return informative error image with playlist details
      return createErrorImageResponse(title, creator, videoCount, backgroundColor);
    }
  } catch (error: any) {
    console.error('[OG Image] Fatal error in OG image generation:', error);
    console.error('[OG Image] Error details:', {
      message: error?.message,
      stack: error?.stack,
    });
    // Return informative error image instead of just black rectangle
    return createErrorImageResponse(title, creator, videoCount, backgroundColor);
  }
}

