import type { Plugin } from 'vite'

// List of known crawler user agents
const CRAWLER_USER_AGENTS = [
  'facebookexternalhit',
  'Twitterbot',
  'LinkedInBot',
  'WhatsApp',
  'Slackbot',
  'Applebot',
  'Googlebot',
  'Bingbot',
  'Slurp',
  'DuckDuckBot',
  'Baiduspider',
  'YandexBot',
  'Sogou',
  'Exabot',
  'ia_archiver',
  'facebookcatalog',
  'Instagram',
]

function isCrawler(userAgent: string): boolean {
  if (!userAgent) return false
  const ua = userAgent.toLowerCase()
  return CRAWLER_USER_AGENTS.some(crawler => ua.includes(crawler.toLowerCase()))
}

export function prerenderPlugin(): Plugin {
  return {
    name: 'prerender-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const userAgent = req.headers['user-agent'] || ''
        
        // Only handle playlist routes for crawlers
        if (isCrawler(userAgent) && req.url) {
          const playlistMatch = req.url.match(/\/(?:PlaylistDetail|playlists)\/([^/?]+)/)
          
          if (playlistMatch) {
            const playlistId = playlistMatch[1]
            const backendUrl = process.env.VITE_BACKEND_URL || 'https://luann-proptosed-circularly.ngrok-free.dev'
            // Use the request protocol and host for baseUrl
            const protocol = req.headers['x-forwarded-proto'] || (req.connection as any)?.encrypted ? 'https' : 'http'
            const baseUrl = process.env.VITE_BASE_URL || (req.headers.host ? `${protocol}://${req.headers.host}` : '')
            
            try {
              // Fetch playlist data from backend
              const headers: HeadersInit = {}
              if (backendUrl.includes('ngrok')) {
                headers['ngrok-skip-browser-warning'] = 'true'
              }
              
              const response = await fetch(`${backendUrl}/api/v1/playlists/public/${playlistId}`, { headers })
              
              if (response.ok) {
                // Read response as text first to check if it's HTML
                const responseText = await response.text()
                
                // Check if response is HTML
                if (responseText.trim().toLowerCase().startsWith('<!doctype') || responseText.trim().toLowerCase().startsWith('<html')) {
                  console.error('Received HTML instead of JSON in prerender plugin')
                  return next()
                }
                
                // Parse JSON
                const result = JSON.parse(responseText)
                const playlistData = result.data
                
                const title = playlistData?.name || 'FITN Playlist'
                const description = playlistData?.owner
                  ? `Playlist by ${playlistData.owner.name || playlistData.owner.username || 'Unknown'} • ${playlistData.videoCount || 0} videos`
                  : 'Explore fitness and lifestyle content on FITN'
                
                const bgColor = new URL(req.url, `http://${req.headers.host}`).searchParams.get('bgColor') || '#000000'
                const playlistUrl = bgColor
                  ? `${baseUrl}${req.url.split('?')[0]}?bgColor=${encodeURIComponent(bgColor)}`
                  : `${baseUrl}${req.url.split('?')[0]}`
                
                // Prioritize playlist cover image over generated OG image
                let playlistImageUrl = null
                if (playlistData?.imageUrl) {
                  playlistImageUrl = playlistData.imageUrl.startsWith('http')
                    ? playlistData.imageUrl
                    : playlistData.imageUrl.startsWith('/')
                      ? `${baseUrl}${playlistData.imageUrl}`
                      : `${backendUrl}${playlistData.imageUrl}`
                }
                
                // Fallback to generated OG image if no playlist cover
                const ogImageUrl = bgColor
                  ? `${backendUrl}/api/v1/og/playlist/${playlistId}?bgColor=${encodeURIComponent(bgColor)}`
                  : `${backendUrl}/api/v1/og/playlist/${playlistId}`
                
                const defaultIconUrl = `${baseUrl}/icon-light-32x32.png`
                // Use playlist cover image first, then OG generated image, then default
                const ogImage = playlistImageUrl || ogImageUrl || defaultIconUrl
                const facebookAppId = process.env.VITE_FACEBOOK_APP_ID || '923362986389142'
                const deepLink = `myapp://PlaylistDetail?id=${playlistId}`
                
                // Generate HTML with meta tags
                const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="${baseUrl}/icon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="music.playlist" />
    <meta property="og:url" content="${playlistUrl}" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:image" content="${ogImage}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:site_name" content="FITN" />
    <meta property="og:locale" content="en_US" />
    <meta property="fb:app_id" content="${facebookAppId}" />
    
    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:url" content="${playlistUrl}" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta name="twitter:image" content="${ogImage}" />
    
    <!-- App Links -->
    <meta property="al:ios:url" content="${deepLink}" />
    <meta property="al:ios:app_store_id" content="1660781140" />
    <meta property="al:ios:app_name" content="FITN" />
    <meta property="al:android:url" content="${deepLink}" />
    <meta property="al:android:package" content="com.georgefitnlifestyle.fitn" />
    <meta property="al:android:app_name" content="FITN" />
    <meta property="al:web:url" content="${playlistUrl}" />
    
    <link rel="canonical" href="${playlistUrl}" />
  </head>
  <body>
    <div id="root">
      <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; font-family: system-ui, -apple-system, sans-serif;">
        <div style="text-align: center;">
          <h1>${escapeHtml(title)}</h1>
          <p>${escapeHtml(description)}</p>
        </div>
      </div>
    </div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`
                
                res.setHeader('Content-Type', 'text/html')
                return res.end(html)
              }
            } catch (error) {
              console.error('Error in prerender plugin:', error)
            }
          }
        }
        
        next()
      })
    },
  }
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }
  return text ? text.replace(/[&<>"']/g, (m) => map[m]) : ''
}

