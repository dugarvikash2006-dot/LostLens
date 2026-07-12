import { Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home'
import Login from './pages/Login'
import Signup from './pages/Signup'
import CreateLostReport from './pages/CreateLostReport'
import MyLostReports from './pages/MyLostReports'
import ItemDetails from './pages/ItemDetails'
import NotFound from './pages/NotFound'
import { AuthProvider } from './context/AuthContext'
import { useAuth } from './context/useAuth'
import './App.css'

function AppShell() {
  const { isLoading } = useAuth()

  // Avoid flashing a logged-out Navbar for a moment before we know
  // whether a stored token is actually valid. Kept intentionally minimal
  // per Phase 2D scope — not a full splash screen.
  if (isLoading) {
    return (
      <div className="app-boot-loading" role="status" aria-live="polite">
        Loading…
      </div>
    )
  }

  return (
    <div className="app">
      <Navbar />

      <main className="app-main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/create-lost"
            element={
              <ProtectedRoute>
                <CreateLostReport />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-reports"
            element={
              <ProtectedRoute>
                <MyLostReports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/items/:id"
            element={
              <ProtectedRoute>
                <ItemDetails />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      <Footer />
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  )
}

export default App
