import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import HomeFeed from './pages/feed/HomeFeed'
import ExploreFeed from './pages/feed/ExploreFeed'
import DailyFeed from './pages/feed/DailyFeed'
import Profile from './pages/profile/Profile'
import Compose from './pages/Compose'
import Settings from './pages/Settings'
import KuPage from './pages/KuPage'
import Collections from './pages/collections/Collections'
import CollectionPage from './pages/collections/CollectionPage'




export default function App() {
  const { user, loading } = useAuth()

  if (loading) return (
    <div className="min-h-screen bg-paper-bg flex items-center justify-center">
      <p className="text-ink-muted text-sm">loading...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-paper-bg">
      <Routes>
        <Route path="/" element={user ? <Navigate to="/home" /> : <Navigate to="/login" />} />
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/home" />} />
        <Route path="/register" element={!user ? <Register /> : <Navigate to="/home" />} />
        <Route path="/home" element={user ? <HomeFeed /> : <Navigate to="/login" />} />
        <Route path="/explore" element={<ExploreFeed />} />
        <Route path="/daily" element={<DailyFeed />} />
        <Route path="/profile/:username" element={<Profile />} />
        <Route path="/hashtag/:tag" element={<ExploreFeed />} />
        <Route path="/compose" element={user ? <Compose /> : <Navigate to="/login" />} />
        <Route path="/settings" element={user ? <Settings /> : <Navigate to="/login" />} />
        <Route path="/ku/:id" element={<KuPage />} />
        <Route path="/collections" element={user ? <Collections /> : <Navigate to="/login" />} />
        <Route path="/collections/:id" element={<CollectionPage />} />

      </Routes>
    </div>
  )
}