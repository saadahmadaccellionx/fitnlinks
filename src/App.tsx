import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import PlaylistPage from './pages/PlaylistPage'
import PlaylistDetailPage from './pages/PlaylistDetailPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/playlists/:id" element={<PlaylistPage />} />
        <Route path="/PlaylistDetail/:id" element={<PlaylistDetailPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App

