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
import Search from './pages/Search'
import WordFilter from './pages/WordFilter'
import ComposeOpenWrite from './pages/ComposeOpenWrite'
import OpenWritePage from './pages/OpenWritePage'
import HashtagFeed from './pages/HashtagFeed'
import ModDashboard from './pages/ModDashboard'
import Notifications from './pages/Notifications'




export default function App() {
  const { user, loading } = useAuth()

  if (loading) return (
    <div className="min-h-screen bg-cafe-bg flex items-center justify-center">
      <div className="text-center animate-fade-in">
        <div className="text-2xl mb-2 animate-float">🍃</div>
        <p className="text-ink-muted text-sm font-display italic">loading...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-cafe-bg">
      <Routes>
        <Route path="/" element={user ? <Navigate to="/home" /> : <Navigate to="/login" />} />
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/home" />} />
        <Route path="/register" element={!user ? <Register /> : <Navigate to="/home" />} />
        <Route path="/home" element={user ? <HomeFeed /> : <Navigate to="/login" />} />
        <Route path="/explore" element={<ExploreFeed />} />
        <Route path="/daily" element={<DailyFeed />} />
        <Route path="/compose" element={user ? <Compose /> : <Navigate to="/login" />} />
        <Route path="/settings" element={user ? <Settings /> : <Navigate to="/login" />} />
        <Route path="/ku/:id" element={<KuPage />} />
        <Route path="/collections" element={user ? <Collections /> : <Navigate to="/login" />} />
        <Route path="/collections/:id" element={<CollectionPage />} />
        <Route path="/search" element={<Search />} />
        <Route path="/settings/filters" element={user ? <WordFilter /> : <Navigate to="/login" />} />
        <Route path="/write" element={user ? <ComposeOpenWrite /> : <Navigate to="/login" />} />
        <Route path="/write/:id" element={<OpenWritePage />} />
        <Route path="/hashtag/:tag" element={<HashtagFeed />} />
        <Route path="/mod" element={user ? <ModDashboard /> : <Navigate to="/login" />} />
        <Route path="/notifications" element={user ? <Notifications /> : <Navigate to="/login" />} />
        <Route path="/profile/:username" element={<Profile />} />

      </Routes>
    </div>
  )
}