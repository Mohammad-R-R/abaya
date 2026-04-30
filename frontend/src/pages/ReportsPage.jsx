import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../utils/api'
import { formatCurrency, formatNumber } from '../utils/format'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts'
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, ArrowUpRight, ArrowDownRight } from 'lucide-react'

const COLORS = ['#d4a017', '#e87c47', '#6b9e78', '#5b7fa6', '#9b6b9e', '#c47a5a']

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-ink-800 text-white px-3 py-2.5 rounded-xl shadow-xl text-xs space-y-1">
      <p className="text-ink-300 font-medium mb-1">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-ink-300">{p.name}:</span>
          <span className="font-semibold">{formatCurrency(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

export default function ReportsPage() {
  const [year, setYear] = useState(new Date().getFullYear())

  const { data: plData, isLoading: plLoading } = useQuery({
    queryKey: ['profit-loss', year],
    queryFn: () => api.get(`/dashboard/profit-loss?year=${year}`).then(r => r.data)
  })

  const { data: overview } = useQuery({
    queryKey: ['dashboard-overview', 'year'],
    queryFn: () => api.get('/dashboard/overview?period=year').then(r => r.data)
  })

  const { data: catData } = useQuery({
    queryKey: ['category-breakdown'],
    queryFn: () => api.get('/dashboard/category-breakdown').then(r => r.data)
  })

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i)

  const totals = plData?.totals

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Financial Reports</h1>
          <p className="text-sm text-ink-400 mt-1">Profit & Loss analysis</p>
        </div>
        <select className="input w-auto" value={year} onChange={e => setYear(Number(e.target.value))}>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Year Summary KPIs */}
      {totals && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Revenue', value: totals.revenue, icon: DollarSign, color: 'bg-gold-500', positive: true },
            { label: 'Gross Profit', value: totals.grossProfit, icon: TrendingUp, color: 'bg-emerald-500', positive: totals.grossProfit >= 0 },
            { label: 'Total Expenses', value: totals.expenses, icon: TrendingDown, color: 'bg-orange-500', positive: false },
            { label: 'Net Profit', value: totals.netProfit, icon: TrendingUp, color: totals.netProfit >= 0 ? 'bg-emerald-600' : 'bg-red-500', positive: totals.netProfit >= 0 }
          ].map(({ label, value, icon: Icon, color, positive }) => (
            <div key={label} className="card">
              <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center mb-3`}>
                <Icon size={18} className="text-white" />
              </div>
              <p className={`text-2xl font-display font-semibold ${value < 0 ? 'text-red-600' : 'text-ink-900'}`}>
                {formatCurrency(value)}
              </p>
              <p className="text-sm text-ink-500 mt-1">{label}</p>
              <div className={`flex items-center gap-1 text-xs mt-1 font-medium ${positive ? 'text-emerald-600' : 'text-red-500'}`}>
                {positive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                {totals.revenue > 0 ? ((Math.abs(value) / totals.revenue) * 100).toFixed(1) : 0}% of revenue
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Monthly P&L Bar Chart */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display text-lg text-ink-900">Monthly Revenue vs Expenses — {year}</h3>
        </div>
        {plLoading ? (
          <div className="h-64 flex items-center justify-center"><div className="w-6 h-6 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={plData?.months} margin={{ top: 5, right: 20, left: -10, bottom: 0 }} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2ddd9" />
              <XAxis dataKey="monthName" tick={{ fontSize: 12, fill: '#7a7368' }} />
              <YAxis tick={{ fontSize: 11, fill: '#7a7368' }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
              <Bar dataKey="revenue" name="Revenue" fill="#d4a017" radius={[4, 4, 0, 0]} maxBarSize={40} />
              <Bar dataKey="expenses" name="Expenses" fill="#e87c47" radius={[4, 4, 0, 0]} maxBarSize={40} />
              <Bar dataKey="netProfit" name="Net Profit" fill="#6b9e78" radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Net Profit Line Chart */}
      <div className="card mb-6">
        <h3 className="font-display text-lg text-ink-900 mb-5">Net Profit Trend — {year}</h3>
        {plData?.months && (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={plData.months} margin={{ top: 5, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2ddd9" />
              <XAxis dataKey="monthName" tick={{ fontSize: 12, fill: '#7a7368' }} />
              <YAxis tick={{ fontSize: 11, fill: '#7a7368' }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="netProfit" name="Net Profit" stroke="#d4a017" strokeWidth={2.5} dot={{ fill: '#d4a017', r: 4 }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="grossProfit" name="Gross Profit" stroke="#6b9e78" strokeWidth={2} strokeDasharray="5 4" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Monthly Detail Table */}
        <div className="card">
          <h3 className="font-display text-lg text-ink-900 mb-4">Monthly Breakdown</h3>
          <div className="table-container">
            <table className="table text-xs">
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Revenue</th>
                  <th>COGS</th>
                  <th>Expenses</th>
                  <th>Net Profit</th>
                </tr>
              </thead>
              <tbody>
                {plData?.months?.map(m => (
                  <tr key={m.month}>
                    <td className="font-medium">{m.monthName}</td>
                    <td className="text-gold-700">{formatCurrency(m.revenue)}</td>
                    <td className="text-orange-600">{formatCurrency(m.cogs)}</td>
                    <td className="text-red-500">{formatCurrency(m.expenses)}</td>
                    <td className={`font-semibold ${m.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {formatCurrency(m.netProfit)}
                    </td>
                  </tr>
                ))}
                {plData?.totals && (
                  <tr className="bg-gold-50 font-bold border-t-2 border-gold-200">
                    <td className="font-bold text-ink-900">Total</td>
                    <td className="text-gold-700">{formatCurrency(plData.totals.revenue)}</td>
                    <td className="text-orange-600">{formatCurrency(plData.totals.cogs)}</td>
                    <td className="text-red-500">{formatCurrency(plData.totals.expenses)}</td>
                    <td className={`font-bold ${plData.totals.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {formatCurrency(plData.totals.netProfit)}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Category Sales */}
        <div className="card">
          <h3 className="font-display text-lg text-ink-900 mb-4">Revenue by Category</h3>
          {catData?.length > 0 ? (
            <div className="space-y-3">
              {catData.map((item, i) => {
                const maxRevenue = catData[0]?.revenue || 1
                const pct = ((item.revenue / maxRevenue) * 100).toFixed(0)
                return (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                        <span className="font-medium text-ink-700">{item.category}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-ink-500 text-xs">{formatNumber(item.quantity)} sold</span>
                        <span className="font-semibold text-ink-900">{formatCurrency(item.revenue)}</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-ink-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: COLORS[i % COLORS.length] }} />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center text-ink-400 text-sm">No sales data</div>
          )}
        </div>
      </div>
    </div>
  )
}
