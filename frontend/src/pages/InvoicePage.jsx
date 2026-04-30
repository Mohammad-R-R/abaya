import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '../utils/api'
import { formatCurrency, formatDateTime, PAYMENT_METHODS } from '../utils/format'
import { Printer, ArrowLeft, Package } from 'lucide-react'

export default function InvoicePage() {
  const { id } = useParams()

  const { data: sale, isLoading } = useQuery({
    queryKey: ['sale', id],
    queryFn: () => api.get(`/sales/${id}`).then(r => r.data)
  })

  if (isLoading) return (
    <div className="min-h-screen bg-ink-50 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!sale) return (
    <div className="min-h-screen bg-ink-50 flex items-center justify-center">
      <p className="text-ink-500">Invoice not found</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-ink-100 py-8 px-4">
      {/* Actions bar - hidden when printing */}
      <div className="max-w-2xl mx-auto mb-4 flex items-center justify-between print:hidden">
        <Link to="/sales" className="btn-secondary">
          <ArrowLeft size={16} /> Back to Sales
        </Link>
        <button onClick={() => window.print()} className="btn-primary">
          <Printer size={16} /> Print Invoice
        </button>
      </div>

      {/* Invoice */}
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg overflow-hidden print:shadow-none print:rounded-none">
        {/* Header */}
        <div className="bg-gradient-to-br from-ink-900 to-ink-700 text-white px-8 py-8">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gold-500 rounded-xl flex items-center justify-center">
                  <span className="text-white font-display text-xl font-bold">ع</span>
                </div>
                <div>
                  <h1 className="font-display text-xl font-semibold">Abaya Store</h1>
                  <p className="text-ink-300 text-xs">متجر العباءات</p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-gold-400 text-xs uppercase tracking-widest font-medium mb-1">Invoice</p>
              <p className="font-mono text-xl text-white font-bold">{sale.invoiceNumber}</p>
              <p className="text-ink-300 text-xs mt-1">{formatDateTime(sale.createdAt)}</p>
            </div>
          </div>
        </div>

        <div className="px-8 py-6">
          {/* Customer & Payment Info */}
          <div className="grid grid-cols-2 gap-6 mb-6 pb-6 border-b border-ink-100">
            <div>
              <p className="text-xs uppercase tracking-wide text-ink-400 font-medium mb-2">Customer</p>
              <p className="font-medium text-ink-800">{sale.customerName || 'Walk-in Customer'}</p>
              {sale.customerPhone && <p className="text-sm text-ink-500 mt-0.5">{sale.customerPhone}</p>}
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-wide text-ink-400 font-medium mb-2">Payment Method</p>
              <p className="font-medium text-ink-800">{PAYMENT_METHODS[sale.paymentMethod]}</p>
              <p className="text-sm text-ink-500 mt-0.5">Served by: {sale.user?.name}</p>
            </div>
          </div>

          {/* Items */}
          <table className="w-full mb-6 text-sm">
            <thead>
              <tr className="border-b border-ink-100">
                <th className="text-left py-2 text-xs uppercase tracking-wide text-ink-400 font-medium">Item</th>
                <th className="text-center py-2 text-xs uppercase tracking-wide text-ink-400 font-medium">Qty</th>
                <th className="text-right py-2 text-xs uppercase tracking-wide text-ink-400 font-medium">Unit Price</th>
                <th className="text-right py-2 text-xs uppercase tracking-wide text-ink-400 font-medium">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-50">
              {sale.items?.map(item => (
                <tr key={item.id}>
                  <td className="py-3">
                    <div className="flex items-center gap-2.5">
                      {item.abaya?.images?.[0]?.url ? (
                        <img src={item.abaya.images[0].url} className="w-9 h-9 rounded-lg object-cover print:hidden" alt="" />
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-ink-50 flex items-center justify-center print:hidden">
                          <Package size={14} className="text-ink-300" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-ink-800">{item.abaya?.name}</p>
                        <p className="text-xs text-ink-400">{item.abaya?.category?.name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 text-center text-ink-700">{item.quantity}</td>
                  <td className="py-3 text-right text-ink-700">{formatCurrency(item.unitPrice)}</td>
                  <td className="py-3 text-right font-medium text-ink-900">{formatCurrency(item.totalPrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="border-t border-ink-100 pt-4 space-y-2">
            <div className="flex justify-between text-sm text-ink-600">
              <span>Subtotal</span>
              <span>{formatCurrency(sale.subtotal)}</span>
            </div>
            {parseFloat(sale.discount) > 0 && (
              <div className="flex justify-between text-sm text-emerald-600">
                <span>Discount</span>
                <span>−{formatCurrency(sale.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold text-ink-900 pt-2 border-t border-ink-200">
              <span>Total</span>
              <span className="text-gold-700">{formatCurrency(sale.total)}</span>
            </div>
          </div>

          {sale.notes && (
            <div className="mt-6 p-3 bg-ink-50 rounded-xl">
              <p className="text-xs text-ink-400 font-medium uppercase tracking-wide mb-1">Notes</p>
              <p className="text-sm text-ink-600">{sale.notes}</p>
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-ink-100 text-center">
            <p className="text-ink-400 text-sm">Thank you for your purchase! شكراً لتسوقكم معنا</p>
          </div>
        </div>
      </div>
    </div>
  )
}
