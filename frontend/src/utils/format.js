export const formatCurrency = (amount, currency = 'ILS') => {
  const num = parseFloat(amount) || 0
  return new Intl.NumberFormat('en-SA', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num)
}

export const formatNumber = (num) => {
  return new Intl.NumberFormat('en').format(num || 0)
}

export const formatDate = (date) => {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

export const formatDateTime = (date) => {
  if (!date) return '—'
  return new Date(date).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export const PAYMENT_METHODS = {
  CASH: 'Cash',
  BANK_TRANSFER: 'Bank Transfer',
  CARD: 'Card',
  OTHER: 'Other'
}

export const EXPENSE_CATEGORIES = {
  RENT: 'Rent',
  SHIPPING: 'Shipping',
  SUPPLIES: 'Supplies',
  UTILITIES: 'Utilities',
  MARKETING: 'Marketing',
  SALARIES: 'Salaries',
  MAINTENANCE: 'Maintenance',
  OTHER: 'Other'
}

export const CATEGORY_COLORS = [
  '#d4a017', '#e87c47', '#6b9e78', '#5b7fa6', '#9b6b9e',
  '#c47a5a', '#4a8fa8', '#8e7a4a'
]
