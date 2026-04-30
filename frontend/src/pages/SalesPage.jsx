import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '../utils/api'
import { formatCurrency, formatDateTime, PAYMENT_METHODS } from '../utils/format'
import { Plus, Search, Eye, FileText, ChevronLeft, ChevronRight } from 'lucide-react'

const PAYMENT_BADGE = {
  CASH: 'badge-green',
  BANK_TRANSFER: 'badge-blue',
  CARD: 'badge-gold',
  OTHER: 'badge-gray'
}

export default function SalesPage() {
  const [page, setPage] = useState(1)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['sales', page, startDate, endDate, paymentMethod],
    queryFn: () => api.get('/sales', {
      params: { page, limit: 20, startDate: startDate || undefined, endDate: endDate || undefined, paymentMethod: paymentMethod || undefined }
    }).then(r => r.data)
  })

  const { data: summary } = useQuery({
    queryKey: ['sales-summary'],
    queryFn: () => api.get('/sales/summary').then(r => r.data)
  })

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Sales</h1>
          <p className="text-sm text-ink-400 mt-1">{data?.pagination?.total || 0} total transactions</p>
        </div>
        <Link to="/sales/new" className="btn-primary">
          <Plus size={16} /> New Sale
        </Link>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: "Today's Sales", data: summary.today },
            { label: 'This Month', data: summary.month },
            { label: 'This Year', data: summary.year }
          ].map(({ label, data: d }) => (
            <div key={label} className="card text-center">
              <p className="text-xs text-ink-400 uppercase tracking-wide font-medium mb-1">{label}</p>
              <p className="text-xl font-display font-semibold text-gold-700">{formatCurrency(d.total)}</p>
              <p className="text-xs text-ink-400 mt-1">{d.count} transactions</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <input type="date" className="input w-auto" value={startDate} onChange={e => { setStartDate(e.target.value); setPage(1) }} />
        <input type="date" className="input w-auto" value={endDate} onChange={e => { setEndDate(e.target.value); setPage(1) }} />
        <select className="input w-auto" value={paymentMethod} onChange={e => { setPaymentMethod(e.target.value); setPage(1) }}>
          <option value="">All Payments</option>
          {Object.entries(PAYMENT_METHODS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        {(startDate || endDate || paymentMethod) && (
          <button className="btn-ghost text-sm" onClick={() => { setStartDate(''); setEndDate(''); setPaymentMethod(''); setPage(1) }}>
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Invoice</th>
              <th>Date</th>
              <th>Customer</th>
              <th>Items</th>
              <th>Payment</th>
              <th>Total</th>
              <th>By</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              [...Array(8)].map((_, i) => (
                <tr key={i}>
                  {[...Array(8)].map((_, j) => (
                    <td key={j}><div className="skeleton h-4 w-full" /></td>
                  ))}
                </tr>
              ))
            ) : data?.data?.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-ink-400">
                  <FileText size={32} className="mx-auto mb-2 text-ink-200" />
                  No sales found
                </td>
              </tr>
            ) : (
              data?.data?.map(sale => (
                <tr key={sale.id}>
                  <td>
                    <span className="font-mono text-xs text-gold-700 font-medium">{sale.invoiceNumber}</span>
                  </td>
                  <td className="text-xs text-ink-500">{formatDateTime(sale.createdAt)}</td>
                  <td className="text-sm">{sale.customerName || <span className="text-ink-300">—</span>}</td>
                  <td>
                    <span className="badge badge-gray">{sale.items?.length || 0} items</span>
                  </td>
                  <td>
                    <span className={`badge ${PAYMENT_BADGE[sale.paymentMethod] || 'badge-gray'}`}>
                      {PAYMENT_METHODS[sale.paymentMethod]}
                    </span>
                  </td>
                  <td className="font-semibold text-ink-900">{formatCurrency(sale.total)}</td>
                  <td className="text-sm text-ink-500">{sale.user?.name}</td>
                  <td>
                    <Link to={`/invoice/${sale.id}`} className="btn-ghost p-1.5" title="View Invoice">
                      <Eye size={15} />
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {data?.pagination && data.pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary disabled:opacity-40 px-3">
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm text-ink-600 px-2">Page {page} of {data.pagination.pages}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={page >= data.pagination.pages} className="btn-secondary disabled:opacity-40 px-3">
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  )
}
