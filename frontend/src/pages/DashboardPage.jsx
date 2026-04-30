import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import api from '../utils/api'
import { formatCurrency, formatDate } from '../utils/format'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts'
import {
  TrendingUp, TrendingDown, Package, ShoppingCart,
  DollarSign, AlertTriangle, ArrowRight, RefreshCw
} from 'lucide-react'

const PERIODS = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'year', label: 'This Year' },
]

const COLORS = ['#d4a017', '#e87c47', '#6b9e78', '#5b7fa6', '#9b6b9e', '#c47a5a']

const StatCard = ({ title, value, sub, icon: Icon, color, trend }) => (
  <div className="card hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between mb-3">
      <div className={`p-2.5 rounded-xl ${color}`}>
        <Icon size={18} className="text-white" />
      </div>
      {trend !== undefined && (
        <span className={`flex items-center gap-1 text-xs font-medium ${trend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
          {trend >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
          {Math.abs(trend)}%
        </span>
      )}
    </div>
    <p className="text-2xl font-display font-semibold text-ink-900">{value}</p>
    <p className="text-sm text-ink-500 mt-1">{title}</p>
    {sub && <p className="text-xs text-ink-400 mt-0.5">{sub}</p>}
  </div>
)

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-ink-800 text-ink-50 px-3 py-2 rounded-xl shadow-lg text-sm">
      <p className="text-ink-300 text-xs mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || '#d4a017' }}>
          {p.name}: {typeof p.value === 'number' && p.name.toLowerCase().includes('revenue') || p.name.toLowerCase().includes('profit') || p.name.toLowerCase().includes('expense')
            ? formatCurrency(p.value) : p.value}
        </p>
      ))}
    </div>
  )
}

export default function DashboardPage() {
  const [period, setPeriod] = useState('month')
  const { isAdmin } = useAuthStore()

  const { data: overview, isLoading, refetch } = useQuery({
    queryKey: ['dashboard-overview', period],
    queryFn: () => api.get(`/dashboard/overview?period=${period}`).then(r => r.data)
  })

  const { data: salesChart } = useQuery({
    queryKey: ['sales-chart'],
    queryFn: () => api.get('/dashboard/sales-chart?days=30').then(r => r.data)
  })

  const { data: categoryData } = useQuery({
    queryKey: ['category-breakdown'],
    queryFn: () => api.get('/dashboard/category-breakdown').then(r => r.data)
  })

  const { data: plData } = useQuery({
    queryKey: ['profit-loss'],
    queryFn: () => api.get(`/dashboard/profit-loss?year=${new Date().getFullYear()}`).then(r => r.data),
    enabled: isAdmin()
  })

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="text-sm text-ink-400 mt-1">
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-white border border-ink-100 rounded-xl p-1 shadow-sm">
            {PERIODS.map(p => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  period === p.value ? 'bg-gold-500 text-white shadow-sm' : 'text-ink-500 hover:text-ink-700'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <button onClick={() => refetch()} className="btn-ghost">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Revenue"
          value={formatCurrency(overview?.revenue || 0)}
          icon={DollarSign}
          color="bg-gold-500"
        />
        <StatCard
          title="Net Profit"
          value={formatCurrency(overview?.netProfit || 0)}
          icon={TrendingUp}
          color={overview?.netProfit >= 0 ? 'bg-emerald-500' : 'bg-red-500'}
        />
        <StatCard
          title="Total Sales"
          value={overview?.salesCount || 0}
          sub="transactions"
          icon={ShoppingCart}
          color="bg-blue-500"
        />
        <StatCard
          title="Expenses"
          value={formatCurrency(overview?.expenses || 0)}
          icon={TrendingDown}
          color="bg-orange-500"
        />
      </div>

      {/* Secondary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="card">
          <p className="text-xs text-ink-400 uppercase tracking-wide font-medium mb-1">Gross Profit</p>
          <p className="text-xl font-display font-semibold text-ink-900">{formatCurrency(overview?.grossProfit || 0)}</p>
          <p className="text-xs text-ink-400 mt-1">After cost of goods</p>
        </div>
        <div className="card">
          <p className="text-xs text-ink-400 uppercase tracking-wide font-medium mb-1">Inventory Value</p>
          <p className="text-xl font-display font-semibold text-ink-900">{formatCurrency(overview?.inventoryValue || 0)}</p>
          <p className="text-xs text-ink-400 mt-1">At cost price</p>
        </div>
        <div className="card">
          <p className="text-xs text-ink-400 uppercase tracking-wide font-medium mb-1">Total Products</p>
          <p className="text-xl font-display font-semibold text-ink-900">{overview?.totalProducts || 0}</p>
          <p className="text-xs text-ink-400 mt-1">Active abayas</p>
        </div>
        <Link to="/inventory" className="card hover:border-gold-200 hover:bg-gold-50 transition-all cursor-pointer">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} className="text-amber-500" />
            <p className="text-xs text-amber-600 uppercase tracking-wide font-medium">Low Stock</p>
          </div>
          <p className="text-xl font-display font-semibold text-ink-900">{overview?.lowStockCount || 0}</p>
          <p className="text-xs text-ink-400 mt-1 flex items-center gap-1">
            View items <ArrowRight size={11} />
          </p>
        </Link>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        {/* Sales Chart */}
        <div className="card lg:col-span-2">
          <h3 className="font-display text-lg text-ink-900 mb-4">Revenue (Last 30 Days)</h3>
          {salesChart ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={salesChart} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#d4a017" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#d4a017" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2ddd9" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#7a7368' }}
                  tickFormatter={d => new Date(d).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                  interval="preserveStartEnd"
                />
                <YAxis tick={{ fontSize: 11, fill: '#7a7368' }} tickFormatter={v => `${v}`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#d4a017" strokeWidth={2.5} fill="url(#goldGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-ink-400">Loading chart...</div>
          )}
        </div>

        {/* Category Pie */}
        <div className="card">
          <h3 className="font-display text-lg text-ink-900 mb-4">Sales by Category</h3>
          {categoryData?.length > 0 ? (
            <div>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={categoryData} dataKey="revenue" nameKey="category" cx="50%" cy="50%" innerRadius={45} outerRadius={70}>
                    {categoryData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val) => formatCurrency(val)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {categoryData.slice(0, 4).map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="text-ink-600">{item.category}</span>
                    </div>
                    <span className="text-ink-800 font-medium">{formatCurrency(item.revenue)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center text-ink-400 text-sm">No sales data yet</div>
          )}
        </div>
      </div>

      {/* P&L Monthly Chart (Admin only) */}
      {isAdmin() && plData && (
        <div className="card mb-8">
          <h3 className="font-display text-lg text-ink-900 mb-4">Monthly Profit & Loss — {plData.year}</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={plData.months} margin={{ top: 5, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2ddd9" />
              <XAxis dataKey="monthName" tick={{ fontSize: 11, fill: '#7a7368' }} />
              <YAxis tick={{ fontSize: 11, fill: '#7a7368' }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="revenue" name="Revenue" fill="#d4a017" radius={[3, 3, 0, 0]} />
              <Bar dataKey="expenses" name="Expenses" fill="#e87c47" radius={[3, 3, 0, 0]} />
              <Bar dataKey="netProfit" name="Net Profit" fill="#6b9e78" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Top Products */}
      {overview?.topProducts?.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-lg text-ink-900">Top Selling Products</h3>
            <Link to="/inventory" className="text-sm text-gold-600 hover:text-gold-700 font-medium flex items-center gap-1">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Product</th>
                  <th>Units Sold</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {overview.topProducts.map((p, i) => (
                  <tr key={i}>
                    <td>
                      <span className="w-6 h-6 inline-flex items-center justify-center rounded-full bg-gold-100 text-gold-700 text-xs font-bold">
                        {i + 1}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-3">
                        {p.image ? (
                          <img src={p.image} className="w-9 h-9 rounded-lg object-cover border border-ink-100" alt="" />
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-gold-50 border border-gold-100 flex items-center justify-center">
                            <Package size={15} className="text-gold-400" />
                          </div>
                        )}
                        <span className="font-medium text-ink-800">{p.name || 'Unknown'}</span>
                      </div>
                    </td>
                    <td>{p.totalQuantity}</td>
                    <td className="font-medium text-gold-700">{formatCurrency(p.totalRevenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
