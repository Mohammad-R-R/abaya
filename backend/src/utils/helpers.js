const generateSKU = (name, category) => {
  const nameCode = name.replace(/\s+/g, '').substring(0, 3).toUpperCase();
  const catCode = category.replace(/\s+/g, '').substring(0, 3).toUpperCase();
  const random = Math.floor(Math.random() * 9000) + 1000;
  return `${catCode}-${nameCode}-${random}`;
};

const generateInvoiceNumber = () => {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const ms = Date.now().toString().slice(-5);
  return `INV-${year}${month}${day}-${ms}`;
};

const formatCurrency = (amount, currency = 'ILS') => {
  return new Intl.NumberFormat('ar-SA', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2
  }).format(amount);
};

module.exports = { generateSKU, generateInvoiceNumber, formatCurrency };
