import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../utils/api'
import { formatCurrency, formatDateTime } from '../utils/format'
import {
  ChevronLeft, Edit2, Package, AlertTriangle, TrendingUp,
  TrendingDown, Image, ChevronLeft as Prev, ChevronRight as Next
} from 'lucide-react'
import AbayaFormModal from '../components/inventory/AbayaFormModal'

export default function AbayaDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showEdit, setShowEdit] = useState(false)
  const [activeImg, setActiveImg] = useState(0)

  const { data: abaya, isLoading } = useQuery({
    queryKey: ['abaya', id],
    queryFn: () => api.get(`/abayas/${id}`).then(r => r.data)
  })

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories').then(r => r.data)
  })

  if (isLoading) return (
    <div className="flex items-center justify-center py-24">
      <div className="w-8 h-8 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!abaya) return (
    <div className="text-center py-20">
      <p className="text-ink-400">Abaya not found</p>
      <Link to="/inventory" className="btn-primary mt-4 inline-flex">Back to Inventory</Link>
    </div>
  )

  const margin = abaya.sellingPrice && abaya.costPrice
    ? (((abaya.sellingPrice - abaya.costPrice) / abaya.costPrice) * 100).toFixed(1)
    : 0

  const imgs = abaya.images || []

  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/inventory')} className="btn-ghost p-2"><ChevronLeft size={20} /></button>
        <div className="flex-1">
          <h1 className="page-title">{abaya.name}</h1>
          {abaya.nameAr && <p className="text-sm text-ink-400 mt-0.5" dir="rtl">{abaya.nameAr}</p>}
        </div>
        <button onClick={() => setShowEdit(true)} className="btn-primary">
          <Edit2 size={16} /> Edit
        </button>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Images */}
        <div className="lg:col-span-2">
          <div className="card p-3">
            <div className="relative rounded-xl overflow-hidden bg-ink-50 aspect-square mb-3">
              {imgs.length > 0 ? (
                <>
                  <img src={imgs[activeImg]?.url} className="w-full h-full object-cover" alt={abaya.name} />
                  {imgs.length > 1 && (
                    <>
                      <button onClick={() => setActiveImg(i => (i - 1 + imgs.length) % imgs.length)}
                        className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center shadow-sm hover:bg-white">
                        <Prev size={16} />
                      </button>
                      <button onClick={() => setActiveImg(i => (i + 1) % imgs.length)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center shadow-sm hover:bg-white">
                        <Next size={16} />
                      </button>
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                        {imgs.map((_, i) => (
                          <button key={i} onClick={() => setActiveImg(i)}
                            className={`w-1.5 h-1.5 rounded-full transition-all ${i === activeImg ? 'bg-white w-3' : 'bg-white/50'}`} />
                        ))}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-ink-300">
                  <Package size={48} />
                  <p className="text-sm mt-2">No images</p>
                </div>
              )}
            </div>

            {imgs.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {imgs.map((img, i) => (
                  <button key={i} onClick={() => setActiveImg(i)}
                    className={`flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${i === activeImg ? 'border-gold-400' : 'border-transparent'}`}>
                    <img src={img.url} className="w-full h-full object-cover" alt="" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="lg:col-span-3 space-y-4">
          {/* Pricing & Stock */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="card text-center py-4">
              <p className="text-xs text-ink-400 uppercase tracking-wide mb-1">Selling Price</p>
              <p className="text-xl font-display font-bold text-gold-700">{formatCurrency(abaya.sellingPrice)}</p>
            </div>
            <div className="card text-center py-4">
              <p className="text-xs text-ink-400 uppercase tracking-wide mb-1">Cost Price</p>
              <p className="text-xl font-display font-bold text-ink-700">{formatCurrency(abaya.costPrice)}</p>
            </div>
            <div className="card text-center py-4">
              <p className="text-xs text-ink-400 uppercase tracking-wide mb-1">Margin</p>
              <p className={`text-xl font-display font-bold flex items-center justify-center gap-1 ${margin >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                {margin >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                {margin}%
              </p>
            </div>
            <div className={`card text-center py-4 ${abaya.isLowStock ? 'bg-red-50 border-red-200' : ''}`}>
              <p className="text-xs text-ink-400 uppercase tracking-wide mb-1">In Stock</p>
              <p className={`text-xl font-display font-bold flex items-center justify-center gap-1 ${abaya.isLowStock ? 'text-red-600' : 'text-ink-900'}`}>
                {abaya.isLowStock && <AlertTriangle size={16} />}
                {abaya.quantity}
              </p>
            </div>
          </div>

          {/* Info */}
          <div className="card">
            <h3 className="font-medium text-ink-700 mb-3">Product Details</h3>
            <dl className="space-y-2.5 text-sm">
              {[
                { label: 'Category', value: abaya.category?.name },
                { label: 'SKU', value: <code className="font-mono text-xs bg-ink-50 px-2 py-0.5 rounded">{abaya.sku}</code> },
                { label: 'Low Stock Alert', value: `${abaya.lowStockAlert} units` },
                { label: 'Status', value: abaya.isActive ? <span className="badge badge-green">Active</span> : <span className="badge badge-gray">Inactive</span> },
                { label: 'Added', value: formatDateTime(abaya.createdAt) },
                { label: 'Last Updated', value: formatDateTime(abaya.updatedAt) },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between">
                  <dt className="text-ink-400">{label}</dt>
                  <dd className="text-ink-800 font-medium text-right">{value}</dd>
                </div>
              ))}
            </dl>
            {abaya.description && (
              <div className="mt-4 pt-4 border-t border-ink-100">
                <p className="text-xs text-ink-400 font-medium uppercase tracking-wide mb-2">Description</p>
                <p className="text-sm text-ink-600 leading-relaxed">{abaya.description}</p>
              </div>
            )}
          </div>

          {/* Stock History */}
          {abaya.stockLogs?.length > 0 && (
            <div className="card">
              <h3 className="font-medium text-ink-700 mb-3">Stock History</h3>
              <div className="space-y-2 max-h-52 overflow-y-auto">
                {abaya.stockLogs.map(log => (
                  <div key={log.id} className="flex items-center justify-between text-sm py-1.5 border-b border-ink-50 last:border-0">
                    <div>
                      <span className={`inline-flex items-center gap-1 font-semibold mr-2 ${log.change > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {log.change > 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                        {log.change > 0 ? '+' : ''}{log.change}
                      </span>
                      <span className="text-ink-500">{log.reason}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-ink-600">{log.before} → {log.after}</p>
                      <p className="text-xs text-ink-400">{formatDateTime(log.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {showEdit && (
        <AbayaFormModal
          abaya={abaya}
          categories={categories || []}
          onClose={() => setShowEdit(false)}
          onSuccess={() => {
            setShowEdit(false)
            queryClient.invalidateQueries({ queryKey: ['abaya', id] })
            queryClient.invalidateQueries({ queryKey: ['abayas'] })
          }}
        />
      )}
    </div>
  )
}
