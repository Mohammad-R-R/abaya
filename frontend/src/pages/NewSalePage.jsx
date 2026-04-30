import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api from '../utils/api'
import { formatCurrency, PAYMENT_METHODS } from '../utils/format'
import {
  Search, Plus, Minus, Trash2, ShoppingCart, Package,
  ChevronLeft, Loader2, Tag, User, Phone
} from 'lucide-react'

export default function NewSalePage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [cart, setCart] = useState([])
  const [discount, setDiscount] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState('CASH')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [notes, setNotes] = useState('')

  const { data: abayasData } = useQuery({
    queryKey: ['abayas-search', search],
    queryFn: () => api.get('/abayas', { params: { search: search || undefined, limit: 20 } }).then(r => r.data),
    enabled: true
  })

  const addToCart = (abaya) => {
    setCart(prev => {
      const existing = prev.find(item => item.abayaId === abaya.id)
      if (existing) {
        if (existing.quantity >= abaya.quantity) {
          toast.error(`Only ${abaya.quantity} in stock`)
          return prev
        }
        return prev.map(item =>
          item.abayaId === abaya.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      }
      if (abaya.quantity === 0) {
        toast.error('Out of stock')
        return prev
      }
      return [...prev, {
        abayaId: abaya.id,
        name: abaya.name,
        image: abaya.images?.find(i => i.isPrimary)?.url || abaya.images?.[0]?.url,
        unitPrice: parseFloat(abaya.sellingPrice),
        quantity: 1,
        maxQty: abaya.quantity
      }]
    })
  }

  const updateQty = (abayaId, delta) => {
    setCart(prev => prev.map(item => {
      if (item.abayaId !== abayaId) return item
      const newQty = item.quantity + delta
      if (newQty <= 0) return null
      if (newQty > item.maxQty) { toast.error(`Only ${item.maxQty} available`); return item }
      return { ...item, quantity: newQty }
    }).filter(Boolean))
  }

  const removeFromCart = (abayaId) => setCart(prev => prev.filter(i => i.abayaId !== abayaId))

  const subtotal = cart.reduce((s, item) => s + item.unitPrice * item.quantity, 0)
  const discountAmt = parseFloat(discount) || 0
  const total = Math.max(0, subtotal - discountAmt)

  const saleMutation = useMutation({
    mutationFn: () => api.post('/sales', {
      items: cart.map(i => ({ abayaId: i.abayaId, quantity: i.quantity })),
      paymentMethod,
      discount: discountAmt,
      customerName: customerName.trim() || undefined,
      customerPhone: customerPhone.trim() || undefined,
      notes: notes.trim() || undefined
    }),
    onSuccess: (res) => {
      toast.success('Sale recorded successfully!')
      navigate(`/invoice/${res.data.id}`)
    },
    onError: (err) => {
      const details = err.response?.data?.details
      if (details?.length) {
        details.forEach(d => toast.error(d))
      } else {
        toast.error(err.response?.data?.error || 'Failed to record sale')
      }
    }
  })

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/sales')} className="btn-ghost p-2">
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="page-title">New Sale</h1>
            <p className="text-sm text-ink-400 mt-0.5">Select abayas and record the transaction</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Product List */}
        <div className="lg:col-span-3 space-y-4">
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              className="input pl-9"
              placeholder="Search abayas to add..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[60vh] overflow-y-auto pr-1">
            {abayasData?.data?.map(abaya => {
              const inCart = cart.find(i => i.abayaId === abaya.id)
              const img = abaya.images?.find(i => i.isPrimary)?.url || abaya.images?.[0]?.url
              return (
                <button
                  key={abaya.id}
                  onClick={() => addToCart(abaya)}
                  disabled={abaya.quantity === 0}
                  className={`card p-0 overflow-hidden text-left hover:shadow-md transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed ${inCart ? 'ring-2 ring-gold-400' : ''}`}
                >
                  <div className="h-32 bg-ink-50 overflow-hidden">
                    {img
                      ? <img src={img} className="w-full h-full object-cover" alt="" />
                      : <div className="w-full h-full flex items-center justify-center"><Package size={28} className="text-ink-200" /></div>
                    }
                    {inCart && (
                      <div className="absolute top-2 right-2 w-5 h-5 bg-gold-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-[10px] font-bold">{inCart.quantity}</span>
                      </div>
                    )}
                  </div>
                  <div className="p-2.5">
                    <p className="text-xs font-medium text-ink-800 truncate">{abaya.name}</p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-gold-600 text-xs font-semibold">{formatCurrency(abaya.sellingPrice)}</p>
                      <p className={`text-[10px] ${abaya.quantity <= 3 ? 'text-red-500' : 'text-ink-400'}`}>
                        {abaya.quantity} left
                      </p>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Cart / Order Summary */}
        <div className="lg:col-span-2">
          <div className="card sticky top-4">
            <div className="flex items-center gap-2 mb-4">
              <ShoppingCart size={18} className="text-gold-600" />
              <h3 className="font-display text-lg text-ink-900">Order Summary</h3>
              {cart.length > 0 && (
                <span className="ml-auto badge badge-gold">{cart.length} items</span>
              )}
            </div>

            {/* Cart Items */}
            {cart.length === 0 ? (
              <div className="text-center py-8 text-ink-400">
                <ShoppingCart size={32} className="mx-auto mb-2 text-ink-200" />
                <p className="text-sm">No items added yet</p>
                <p className="text-xs mt-1">Click a product to add it</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-56 overflow-y-auto mb-4">
                {cart.map(item => (
                  <div key={item.abayaId} className="flex items-center gap-2.5 p-2 rounded-xl bg-ink-50 group">
                    {item.image
                      ? <img src={item.image} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" alt="" />
                      : <div className="w-10 h-10 rounded-lg bg-ink-100 flex items-center justify-center flex-shrink-0"><Package size={14} className="text-ink-300" /></div>
                    }
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-ink-800 truncate">{item.name}</p>
                      <p className="text-xs text-gold-600">{formatCurrency(item.unitPrice)}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => updateQty(item.abayaId, -1)} className="w-6 h-6 rounded-lg bg-white border border-ink-200 flex items-center justify-center hover:bg-ink-100 transition-colors">
                        <Minus size={11} />
                      </button>
                      <span className="text-sm font-semibold text-ink-800 w-5 text-center">{item.quantity}</span>
                      <button onClick={() => updateQty(item.abayaId, 1)} className="w-6 h-6 rounded-lg bg-white border border-ink-200 flex items-center justify-center hover:bg-ink-100 transition-colors">
                        <Plus size={11} />
                      </button>
                    </div>
                    <p className="text-xs font-semibold text-ink-700 w-16 text-right">{formatCurrency(item.unitPrice * item.quantity)}</p>
                    <button onClick={() => removeFromCart(item.abayaId)} className="text-ink-300 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 ml-1">
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {cart.length > 0 && (
              <>
                {/* Customer Info */}
                <div className="space-y-2 mb-4 pb-4 border-b border-ink-100">
                  <div className="relative">
                    <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
                    <input className="input pl-8 py-2 text-sm" placeholder="Customer name (optional)" value={customerName} onChange={e => setCustomerName(e.target.value)} />
                  </div>
                  <div className="relative">
                    <Phone size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
                    <input className="input pl-8 py-2 text-sm" placeholder="Phone (optional)" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} />
                  </div>
                </div>

                {/* Discount & Payment */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-2">
                    <Tag size={14} className="text-ink-400 flex-shrink-0" />
                    <div className="flex-1 relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-ink-400">ILS</span>
                      <input
                        type="number" min="0" max={subtotal}
                        className="input pl-12 py-2 text-sm"
                        placeholder="Discount amount"
                        value={discount}
                        onChange={e => setDiscount(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(PAYMENT_METHODS).map(([val, label]) => (
                      <button
                        key={val}
                        onClick={() => setPaymentMethod(val)}
                        className={`py-2 px-3 rounded-xl text-xs font-medium border transition-all ${
                          paymentMethod === val
                            ? 'bg-gold-500 text-white border-gold-500 shadow-sm'
                            : 'bg-white text-ink-600 border-ink-200 hover:border-gold-200'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  <textarea
                    rows={2}
                    className="input text-sm resize-none"
                    placeholder="Notes (optional)"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                  />
                </div>

                {/* Totals */}
                <div className="bg-ink-50 rounded-xl p-3 space-y-1.5 mb-4 text-sm">
                  <div className="flex justify-between text-ink-600">
                    <span>Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  {discountAmt > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Discount</span>
                      <span>−{formatCurrency(discountAmt)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold text-ink-900 text-base pt-1 border-t border-ink-200">
                    <span>Total</span>
                    <span className="text-gold-700">{formatCurrency(total)}</span>
                  </div>
                </div>

                <button
                  onClick={() => saleMutation.mutate()}
                  disabled={cart.length === 0 || saleMutation.isPending}
                  className="btn-primary w-full justify-center py-3"
                >
                  {saleMutation.isPending
                    ? <Loader2 size={16} className="animate-spin" />
                    : `Confirm Sale — ${formatCurrency(total)}`
                  }
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
