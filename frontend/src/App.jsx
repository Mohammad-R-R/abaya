import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import Layout from './components/layout/Layout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import InventoryPage from './pages/InventoryPage'
import AbayaDetailPage from './pages/AbayaDetailPage'
import SalesPage from './pages/SalesPage'
import NewSalePage from './pages/NewSalePage'
import ExpensesPage from './pages/ExpensesPage'
import ImportPage from './pages/ImportPage'
import ReportsPage from './pages/ReportsPage'
import InvoicePage from './pages/InvoicePage'

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { isAuthenticated, isAdmin } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (adminOnly && !isAdmin()) return <Navigate to="/" replace />
  return children
}

export default function App() {
  const { initAuth } = useAuthStore()

  useEffect(() => {
    initAuth()
  }, [initAuth])

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/invoice/:id" element={
        <ProtectedRoute><InvoicePage /></ProtectedRoute>
      } />
      <Route path="/" element={
        <ProtectedRoute><Layout /></ProtectedRoute>
      }>
        <Route index element={<DashboardPage />} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="inventory/:id" element={<AbayaDetailPage />} />
        <Route path="sales" element={<SalesPage />} />
        <Route path="sales/new" element={<NewSalePage />} />
        <Route path="expenses" element={<ExpensesPage />} />
        <Route path="import" element={
          <ProtectedRoute adminOnly><ImportPage /></ProtectedRoute>
        } />
        <Route path="reports" element={
          <ProtectedRoute adminOnly><ReportsPage /></ProtectedRoute>
        } />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
