import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuthStore } from '../../store/authStore'
import { useQuery } from '@tanstack/react-query'
import api from '../../utils/api'
import {
  LayoutDashboard, Package, ShoppingCart, Receipt,
  BarChart3, Upload, Menu, X, LogOut, AlertTriangle,
  ChevronRight, User
} from 'lucide-react'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/inventory', label: 'Inventory', icon: Package },
  { to: '/sales', label: 'Sales', icon: ShoppingCart },
  { to: '/expenses', label: 'Expenses', icon: Receipt },
  { to: '/reports', label: 'Reports', icon: BarChart3, adminOnly: true },
  { to: '/import', label: 'Import Data', icon: Upload, adminOnly: true },
]

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, logout, isAdmin } = useAuthStore()
  const navigate = useNavigate()

  const { data: lowStock } = useQuery({
    queryKey: ['low-stock-count'],
    queryFn: () => api.get('/abayas/low-stock').then(r => r.data.count),
    refetchInterval: 60000
  })

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-ink-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gold-500 rounded-xl flex items-center justify-center text-white font-display font-bold text-lg shadow-sm">
            ع
          </div>
          <div>
            <p className="font-display text-ink-900 font-semibold text-base leading-tight">Abaya Store</p>
            <p className="text-xs text-ink-400">Management System</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(item => {
          if (item.adminOnly && !isAdmin()) return null
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
              {item.to === '/inventory' && lowStock > 0 && (
                <span className="ml-auto badge badge-red">{lowStock}</span>
              )}
            </NavLink>
          )
        })}
      </nav>

      {/* Low stock alert */}
      {lowStock > 0 && (
        <div className="mx-3 mb-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
          <div className="flex items-center gap-2 text-amber-700">
            <AlertTriangle size={15} />
            <span className="text-xs font-medium">{lowStock} items low on stock</span>
          </div>
        </div>
      )}

      {/* User */}
      <div className="px-3 py-3 border-t border-ink-100">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-ink-50">
          <div className="w-8 h-8 bg-gold-100 rounded-lg flex items-center justify-center">
            <User size={16} className="text-gold-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-ink-800 truncate">{user?.name}</p>
            <p className="text-xs text-ink-400 capitalize">{user?.role?.toLowerCase()}</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-ink-400 hover:text-red-500 transition-colors p-1"
            title="Logout"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-ink-50 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col bg-white border-r border-ink-100 flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-ink-900/50 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-72 bg-white flex flex-col animate-slide-up">
            <button
              className="absolute top-4 right-4 text-ink-400 hover:text-ink-700"
              onClick={() => setSidebarOpen(false)}
            >
              <X size={20} />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Top Bar */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-ink-100">
          <button onClick={() => setSidebarOpen(true)} className="text-ink-600">
            <Menu size={22} />
          </button>
          <p className="font-display text-ink-900 font-semibold">Abaya Store</p>
          <div className="w-6" />
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="max-w-7xl mx-auto animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
