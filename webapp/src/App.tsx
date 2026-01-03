import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Home from './pages/Home'
import ResetPassword from './pages/ResetPassword'
import Auth from './pages/app/Auth'
import Articles from './pages/app/Articles'
import ArticleDetail from './pages/app/ArticleDetail'

// Protected route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  
  if (isLoading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner" />
      </div>
    )
  }
  
  if (!user) {
    return <Navigate to="/app/auth" replace />
  }
  
  return <>{children}</>
}

// App routes with auth provider
function AppRoutes() {
  return (
    <Routes>
      {/* Marketing pages */}
      <Route path="/" element={<Home />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      
      {/* App pages */}
      <Route path="/app/auth" element={<Auth />} />
      <Route path="/app" element={
        <ProtectedRoute>
          <Articles />
        </ProtectedRoute>
      } />
      <Route path="/app/article/:id" element={
        <ProtectedRoute>
          <ArticleDetail />
        </ProtectedRoute>
      } />
      
      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}

export default App
