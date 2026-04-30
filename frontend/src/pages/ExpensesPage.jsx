import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api from '../utils/api'
import { formatCurrency, formatDate, EXPENSE_CATEGORIES } from '../utils/format'
import { Plus, Trash2, Edit2, Receipt, ChevronLeft, ChevronRight, X, Loader2 } from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const COLORS = ['#d4a017', '#e87c47', '#6b9e78', '#5b7fa6', '#9b6b9e', '#c47a5a', '#4a8fa8', '#8e7a4a']

function ExpenseFormModal({ expense, onClose, onSuccess }) {
  const isEdit = !!expense
  const [form, setForm] = useState({
    category: expense?.category || '',
    description: expense?.description || '',
    amount: expense?.amount || '',
    date: expense?.date ? expense.date.split('T')[0] : new Date().toISOString().split('T')[0]
  })

  const mutation = useMutation({
    mutationFn: (data) => isEdit ? api.put(`/expenses/${expense.id}`, data) : api.post('/expenses', data),
    onSuccess: () => { toast.success(isEdit ? 'Expense updated!' : 'Expense added!'); onSuccess() },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to save')
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.category || !form.description || !form.amount) return toast.error('All fields are required')
    if (parseFloat(form.amount) <= 0) return toast.error('Amount must be greater than 0')
    mutation.mutate(form)
  }

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-scale-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-ink-100">
          <h2 className="font-display text-xl text-ink-900">{isEdit ? 'Edit Expense' : 'Add Expense'}</h2>
          <button onClick={onClose} className="btn-ghost p-2"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="label">Category *</label>
            <select className="input" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} required>
              <option value="">Select category...</option>
              {Object.entries(EXPENSE_CATEGORIES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Description *</label>
            <input className="input" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="e.g. Monthly store rent" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Amount (ILS) *</label>
              <input type="number" min="0.01" step="0.01" className="input" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} placeholder="0.00" required />
            </div>
            <div>
              <label className="label">Date</label>
              <input type="date" className="input" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={mutation.isPending} className="btn-primary flex-1 justify-center">
              {mutation.isPending ? <Loader2 size={16} className="animate-spin" /> : (isEdit ? 'Save Changes' : 'Add Expense')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function ExpensesPage() {
  const [page, setPage] = useState(1)
  const [category, setCategory] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editExpense, setEditExpense] = useState(null)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['expenses', page, category, startDate, endDate],
    queryFn: () => api.get('/expenses', {
      params: { page, limit: 20, category: category || undefined, startDate: startDate || undefined, endDate: endDate || undefined }
    }).then(r => r.data)
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/expenses/${id}`),
    onSuccess: () => { toast.success('Expense deleted'); queryClient.invalidateQueries({ queryKey: ['expenses'] }) },
    onError: (err) => toast.error(err.response?.data?.error || 'Delete failed')
  })

  const handleSuccess = () => {
    setShowForm(false)
    setEditExpense(null)
    queryClient.invalidateQueries({ queryKey: ['expenses'] })
  }

  // Build chart data from summary
  const chartData = data?.summary?.map((item, i) => ({
    name: EXPENSE_CATEGORIES[item.category] || item.category,
    value: parseFloat(item._sum.amount) || 0,
    color: COLORS[i % COLORS.length]
  })).filter(d => d.value > 0) || []

  const totalExpenses = chartData.reduce((s, d) => s + d.value, 0)

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Expenses</h1>
          <p className="text-sm text-ink-400 mt-1">{data?.pagination?.total || 0} records</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          <Plus size={16} /> Add Expense
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        {/* Summary Card */}
        <div className="card">
          <p className="text-xs text-ink-400 uppercase tracking-wide font-medium mb-3">Total Expenses (filtered)</p>
          <p className="text-3xl font-display font-semibold text-ink-900">{formatCurrency(totalExpenses)}</p>
          {chartData.length > 0 && (
            <div className="mt-4 space-y-2">
              {chartData.slice(0, 5).map((item, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                    <span className="text-ink-600">{item.name}</span>
                  </div>
                  <span className="text-ink-800 font-medium">{formatCurrency(item.value)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Chart */}
        <div className="card lg:col-span-2">
          <p className="text-xs text-ink-400 uppercase tracking-wide font-medium mb-3">By Category</p>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={75}>
                  {chartData.map((item, i) => <Cell key={i} fill={item.color} />)}
                </Pie>
                <Tooltip formatter={(v) => formatCurrency(v)} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-40 flex items-center justify-center text-ink-400 text-sm">No expense data</div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <select className="input w-auto" value={category} onChange={e => { setCategory(e.target.value); setPage(1) }}>
          <option value="">All Categories</option>
          {Object.entries(EXPENSE_CATEGORIES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <input type="date" className="input w-auto" value={startDate} onChange={e => { setStartDate(e.target.value); setPage(1) }} />
        <input type="date" className="input w-auto" value={endDate} onChange={e => { setEndDate(e.target.value); setPage(1) }} />
        {(category || startDate || endDate) && (
          <button className="btn-ghost text-sm" onClick={() => { setCategory(''); setStartDate(''); setEndDate(''); setPage(1) }}>Clear</button>
        )}
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Category</th>
              <th>Description</th>
              <th>Amount</th>
              <th>Added By</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              [...Array(6)].map((_, i) => (
                <tr key={i}>{[...Array(6)].map((_, j) => <td key={j}><div className="skeleton h-4 w-full" /></td>)}</tr>
              ))
            ) : data?.data?.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-ink-400">
                  <Receipt size={32} className="mx-auto mb-2 text-ink-200" />
                  No expenses found
                </td>
              </tr>
            ) : data?.data?.map(exp => (
              <tr key={exp.id}>
                <td className="text-sm text-ink-500">{formatDate(exp.date)}</td>
                <td>
                  <span className="badge badge-gold">{EXPENSE_CATEGORIES[exp.category] || exp.category}</span>
                </td>
                <td className="text-ink-700">{exp.description}</td>
                <td className="font-semibold text-ink-900">{formatCurrency(exp.amount)}</td>
                <td className="text-sm text-ink-500">{exp.user?.name}</td>
                <td>
                  <div className="flex gap-1">
                    <button onClick={() => { setEditExpense(exp); setShowForm(true) }} className="btn-ghost p-1.5">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => confirm('Delete this expense?') && deleteMutation.mutate(exp.id)} className="btn-ghost p-1.5 hover:text-red-500">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data?.pagination?.pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary disabled:opacity-40 px-3"><ChevronLeft size={16} /></button>
          <span className="text-sm text-ink-600 px-2">Page {page} of {data.pagination.pages}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={page >= data.pagination.pages} className="btn-secondary disabled:opacity-40 px-3"><ChevronRight size={16} /></button>
        </div>
      )}

      {showForm && (
        <ExpenseFormModal
          expense={editExpense}
          onClose={() => { setShowForm(false); setEditExpense(null) }}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  )
}
