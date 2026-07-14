import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import BookingPage from './pages/BookingPage'
import BookingSuccess from './pages/BookingSuccess'
import BookingCancel from './pages/BookingCancel'
import PublicProfile from './pages/PublicProfile'
import Landing from './pages/Landing'
import SuperAdminDashboard from './pages/SuperAdminDashboard'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token')
  if (!token) return <Navigate to="/login" replace />
  return <>{children}</>
}

function SuperAdminProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token')
  const role = localStorage.getItem('role') || sessionStorage.getItem('role')
  if (!token) return <Navigate to="/login" replace />
  if (role !== 'superadmin') return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

function RootRouteWrapper() {
  const hostname = window.location.hostname;
  const parts = hostname.split('.');
  
  // Exclude main domains: localhost, 127.0.0.1, boramarka.com.br, www.boramarka.com.br
  const isMainDomain = 
    hostname === 'localhost' || 
    hostname === '127.0.0.1' ||
    (parts.length === 2 && parts[0] === 'boramarka') ||
    (parts.length === 3 && parts[1] === 'boramarka' && parts[0] === 'www');

  // Also local subdomain test: e.g. salao.localhost
  const isLocalSubdomain = parts.length === 2 && parts[1] === 'localhost' && parts[0] !== 'www';

  const isDomainAccess = (!isMainDomain && parts.length >= 2) || isLocalSubdomain;

  if (isDomainAccess) {
    return <PublicProfile />;
  }

  return <Landing />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootRouteWrapper />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/superadmin"
          element={
            <SuperAdminProtectedRoute>
              <SuperAdminDashboard />
            </SuperAdminProtectedRoute>
          }
        />
        <Route path="/p/:username" element={<PublicProfile />} />
        <Route path="/agendar/:token" element={<BookingPage />} />
        <Route path="/agendar/:token/sucesso" element={<BookingSuccess />} />
        <Route path="/agendar/:token/cancelar/:bookingId" element={<BookingCancel />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
