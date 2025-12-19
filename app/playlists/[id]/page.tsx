import { PlaylistView } from "@/components/playlist-view";
import { OpenAppButton } from "@/components/open-app-button";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    page?: string;
    limit?: string;
  }>;
}

export default async function PlaylistPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { page = '1', limit = '12' } = await searchParams;

  let playlistData = null;
  let error = null;

  try {
    // Call Express backend directly
    const backendUrl = process.env.BACKEND_URL || 'https://luann-proptosed-circularly.ngrok-free.dev';
    const url = new URL(`${backendUrl}/api/v1/playlists/${id}`);
    url.searchParams.set('page', page);
    url.searchParams.set('limit', limit);

    console.log('Fetching playlist from:', url.toString());

    const response = await fetch(url.toString(), {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const statusText = response.statusText || `HTTP ${response.status}`;
      error = errorData.error || errorData.message || `Failed to load playlist: ${statusText}`;
      console.error('Error response:', { status: response.status, statusText, errorData });
    } else {
      playlistData = await response.json();
    }
  } catch (err: any) {
    console.error('Error fetching playlist:', err);
    const errorMessage = err.message || 'Unknown error';
    const isConnectionError = errorMessage.includes('fetch failed') || 
                              errorMessage.includes('ECONNREFUSED') ||
                              errorMessage.includes('Failed to fetch');
    
    if (isConnectionError) {
      error = `Cannot connect to backend server at ${process.env.BACKEND_URL || 'https://luann-proptosed-circularly.ngrok-free.dev'}. Please ensure the Express backend is running.`;
    } else {
      error = `Failed to load playlist: ${errorMessage}`;
    }
  }

  return (
    <>
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 py-4 flex justify-end">
          <OpenAppButton playlistId={id} variant="outline" size="sm" />
        </div>
      </div>
      <PlaylistView playlistData={playlistData} error={error} playlistId={id} />
    </>
  );
}

