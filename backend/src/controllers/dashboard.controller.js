const prisma = require('../utils/prisma');

const getOverview = async (req, res, next) => {
  try {
    const { period = 'month' } = req.query;
    
    const now = new Date();
    let startDate;
    
    switch (period) {
      case 'today':
        startDate = new Date(now); startDate.setHours(0, 0, 0, 0); break;
      case 'week':
        startDate = new Date(now); startDate.setDate(now.getDate() - 7); break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1); break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1); break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const [
      totalRevenue, totalExpenses,
      totalSalesCount, totalInventoryValue,
      lowStockCount, totalProducts,
      topProducts
    ] = await Promise.all([
      // Revenue
      prisma.sale.aggregate({
        where: { createdAt: { gte: startDate } },
        _sum: { total: true }
      }),
      // Expenses
      prisma.expense.aggregate({
        where: { date: { gte: startDate } },
        _sum: { amount: true }
      }),
      // Sales count
      prisma.sale.count({ where: { createdAt: { gte: startDate } } }),
      // Inventory value
      prisma.abaya.findMany({
        where: { isActive: true },
        select: { quantity: true, costPrice: true }
      }),
      // Low stock
      prisma.abaya.count({
        where: { isActive: true, quantity: { lte: 5 } }
      }),
      // Total products
      prisma.abaya.count({ where: { isActive: true } }),
      // Top products
      prisma.saleItem.groupBy({
        by: ['abayaId'],
        where: { sale: { createdAt: { gte: startDate } } },
        _sum: { quantity: true, totalPrice: true },
        orderBy: { _sum: { totalPrice: 'desc' } },
        take: 5
      })
    ]);

    const inventoryValue = totalInventoryValue.reduce(
      (sum, a) => sum + (parseFloat(a.costPrice) * a.quantity), 0
    );

    const revenue = parseFloat(totalRevenue._sum.total) || 0;
    const expenses = parseFloat(totalExpenses._sum.amount) || 0;
    
    // Calculate COGS from sale items
    const salesWithCost = await prisma.saleItem.findMany({
      where: { sale: { createdAt: { gte: startDate } } },
      include: { abaya: { select: { costPrice: true } } }
    });
    const cogs = salesWithCost.reduce(
      (sum, item) => sum + (parseFloat(item.abaya.costPrice) * item.quantity), 0
    );
    
    const grossProfit = revenue - cogs;
    const netProfit = grossProfit - expenses;

    // Enrich top products
    const topProductIds = topProducts.map(t => t.abayaId);
    const topProductDetails = await prisma.abaya.findMany({
      where: { id: { in: topProductIds } },
      select: { id: true, name: true, images: { where: { isPrimary: true }, take: 1 } }
    });

    const enrichedTopProducts = topProducts.map(tp => {
      const detail = topProductDetails.find(d => d.id === tp.abayaId);
      return {
        ...tp,
        name: detail?.name,
        image: detail?.images[0]?.url,
        totalRevenue: tp._sum.totalPrice,
        totalQuantity: tp._sum.quantity
      };
    });

    res.json({
      period,
      revenue,
      expenses,
      grossProfit,
      netProfit,
      cogs,
      salesCount: totalSalesCount,
      inventoryValue,
      lowStockCount,
      totalProducts,
      topProducts: enrichedTopProducts
    });
  } catch (error) {
    next(error);
  }
};

const getProfitLoss = async (req, res, next) => {
  try {
    const { year = new Date().getFullYear() } = req.query;
    
    const months = [];
    for (let month = 0; month < 12; month++) {
      const start = new Date(year, month, 1);
      const end = new Date(year, month + 1, 0, 23, 59, 59);

      const [salesData, expensesData, saleItems] = await Promise.all([
        prisma.sale.aggregate({
          where: { createdAt: { gte: start, lte: end } },
          _sum: { total: true },
          _count: true
        }),
        prisma.expense.aggregate({
          where: { date: { gte: start, lte: end } },
          _sum: { amount: true }
        }),
        prisma.saleItem.findMany({
          where: { sale: { createdAt: { gte: start, lte: end } } },
          include: { abaya: { select: { costPrice: true } } }
        })
      ]);

      const revenue = parseFloat(salesData._sum.total) || 0;
      const expenses = parseFloat(expensesData._sum.amount) || 0;
      const cogs = saleItems.reduce((sum, item) => sum + (parseFloat(item.abaya.costPrice) * item.quantity), 0);
      
      months.push({
        month: month + 1,
        monthName: new Date(year, month, 1).toLocaleString('en-US', { month: 'short' }),
        revenue,
        expenses,
        cogs,
        grossProfit: revenue - cogs,
        netProfit: revenue - cogs - expenses,
        salesCount: salesData._count
      });
    }

    const totals = months.reduce((acc, m) => ({
      revenue: acc.revenue + m.revenue,
      expenses: acc.expenses + m.expenses,
      cogs: acc.cogs + m.cogs,
      grossProfit: acc.grossProfit + m.grossProfit,
      netProfit: acc.netProfit + m.netProfit,
      salesCount: acc.salesCount + m.salesCount
    }), { revenue: 0, expenses: 0, cogs: 0, grossProfit: 0, netProfit: 0, salesCount: 0 });

    res.json({ year: parseInt(year), months, totals });
  } catch (error) {
    next(error);
  }
};

const getSalesChart = async (req, res, next) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    startDate.setHours(0, 0, 0, 0);

    const sales = await prisma.sale.findMany({
      where: { createdAt: { gte: startDate } },
      select: { total: true, createdAt: true },
      orderBy: { createdAt: 'asc' }
    });

    // Group by day
    const grouped = {};
    sales.forEach(sale => {
      const dateKey = sale.createdAt.toISOString().split('T')[0];
      if (!grouped[dateKey]) grouped[dateKey] = { revenue: 0, count: 0 };
      grouped[dateKey].revenue += parseFloat(sale.total);
      grouped[dateKey].count++;
    });

    // Fill missing days with 0
    const result = [];
    const current = new Date(startDate);
    const end = new Date();
    while (current <= end) {
      const key = current.toISOString().split('T')[0];
      result.push({
        date: key,
        revenue: grouped[key]?.revenue || 0,
        count: grouped[key]?.count || 0
      });
      current.setDate(current.getDate() + 1);
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
};

const getCategoryBreakdown = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    
    const where = {};
    if (startDate) where.sale = { createdAt: { gte: new Date(startDate) } };
    if (endDate) {
      const end = new Date(endDate); end.setHours(23, 59, 59, 999);
      where.sale = { ...(where.sale || {}), createdAt: { ...(where.sale?.createdAt || {}), lte: end } };
    }

    const items = await prisma.saleItem.findMany({
      where,
      include: {
        abaya: { include: { category: { select: { name: true } } } }
      }
    });

    const byCategory = {};
    items.forEach(item => {
      const catName = item.abaya.category.name;
      if (!byCategory[catName]) byCategory[catName] = { revenue: 0, quantity: 0 };
      byCategory[catName].revenue += parseFloat(item.totalPrice);
      byCategory[catName].quantity += item.quantity;
    });

    res.json(
      Object.entries(byCategory).map(([name, data]) => ({ category: name, ...data }))
        .sort((a, b) => b.revenue - a.revenue)
    );
  } catch (error) {
    next(error);
  }
};

module.exports = { getOverview, getProfitLoss, getSalesChart, getCategoryBreakdown };
