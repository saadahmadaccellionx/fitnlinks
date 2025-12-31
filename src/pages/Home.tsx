import { PlaylistView } from "@/components/playlist-view"

export default function Home() {
  return (
    <main className="min-h-screen">
      <PlaylistView playlistData={null} error={null} />
    </main>
  )
}

