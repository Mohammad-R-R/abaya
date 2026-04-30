const prisma = require('../utils/prisma');
const { generateInvoiceNumber } = require('../utils/helpers');

const getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, startDate, endDate, paymentMethod } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }
    if (paymentMethod) where.paymentMethod = paymentMethod;

    const [sales, total] = await Promise.all([
      prisma.sale.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { name: true } },
          items: {
            include: {
              abaya: { 
                select: { name: true, images: { where: { isPrimary: true }, take: 1 } } 
              }
            }
          }
        }
      }),
      prisma.sale.count({ where })
    ]);

    res.json({
      data: sales,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) }
    });
  } catch (error) {
    next(error);
  }
};

const getOne = async (req, res, next) => {
  try {
    const sale = await prisma.sale.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { name: true, email: true } },
        items: {
          include: {
            abaya: {
              include: {
                category: { select: { name: true } },
                images: { where: { isPrimary: true }, take: 1 }
              }
            }
          }
        }
      }
    });

    if (!sale) return res.status(404).json({ error: 'Sale not found.' });
    res.json(sale);
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const { items, paymentMethod, discount = 0, notes, customerName, customerPhone } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'At least one item is required.' });
    }

    // Validate all items exist and have enough stock
    const abayaIds = items.map(i => i.abayaId);
    const abayas = await prisma.abaya.findMany({
      where: { id: { in: abayaIds }, isActive: true }
    });

    const abayaMap = Object.fromEntries(abayas.map(a => [a.id, a]));

    const validationErrors = [];
    for (const item of items) {
      const abaya = abayaMap[item.abayaId];
      if (!abaya) {
        validationErrors.push(`Abaya with ID ${item.abayaId} not found.`);
        continue;
      }
      if (item.quantity <= 0) {
        validationErrors.push(`Quantity for "${abaya.name}" must be greater than 0.`);
      }
      if (abaya.quantity < item.quantity) {
        validationErrors.push(`Insufficient stock for "${abaya.name}". Available: ${abaya.quantity}, Requested: ${item.quantity}.`);
      }
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({ error: 'Validation failed.', details: validationErrors });
    }

    // Calculate totals
    let subtotal = 0;
    const saleItems = items.map(item => {
      const abaya = abayaMap[item.abayaId];
      const unitPrice = parseFloat(abaya.sellingPrice);
      const totalPrice = unitPrice * item.quantity;
      subtotal += totalPrice;
      return {
        abayaId: item.abayaId,
        quantity: item.quantity,
        unitPrice,
        totalPrice
      };
    });

    const discountAmount = parseFloat(discount) || 0;
    const total = subtotal - discountAmount;

    if (total < 0) {
      return res.status(400).json({ error: 'Discount cannot exceed subtotal.' });
    }

    const invoiceNumber = generateInvoiceNumber();

    const sale = await prisma.$transaction(async (tx) => {
      const newSale = await tx.sale.create({
        data: {
          invoiceNumber,
          userId: req.user.id,
          subtotal,
          discount: discountAmount,
          total,
          paymentMethod: paymentMethod || 'CASH',
          notes: notes?.trim(),
          customerName: customerName?.trim(),
          customerPhone: customerPhone?.trim(),
          items: { create: saleItems }
        },
        include: {
          items: { include: { abaya: true } },
          user: { select: { name: true } }
        }
      });

      // Deduct stock for each item
      for (const item of items) {
        const abaya = abayaMap[item.abayaId];
        const newQty = abaya.quantity - item.quantity;

        await tx.abaya.update({
          where: { id: item.abayaId },
          data: { quantity: newQty }
        });

        await tx.stockLog.create({
          data: {
            abayaId: item.abayaId,
            change: -item.quantity,
            reason: `Sale #${invoiceNumber}`,
            before: abaya.quantity,
            after: newQty
          }
        });
      }

      return newSale;
    });

    res.status(201).json(sale);
  } catch (error) {
    next(error);
  }
};

const getSummary = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const yearStart = new Date(today.getFullYear(), 0, 1);

    const [todaySales, monthSales, yearSales, recentSales] = await Promise.all([
      prisma.sale.aggregate({
        where: { createdAt: { gte: today, lte: todayEnd } },
        _sum: { total: true },
        _count: true
      }),
      prisma.sale.aggregate({
        where: { createdAt: { gte: monthStart } },
        _sum: { total: true },
        _count: true
      }),
      prisma.sale.aggregate({
        where: { createdAt: { gte: yearStart } },
        _sum: { total: true },
        _count: true
      }),
      prisma.sale.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { items: true, user: { select: { name: true } } }
      })
    ]);

    res.json({
      today: { total: todaySales._sum.total || 0, count: todaySales._count },
      month: { total: monthSales._sum.total || 0, count: monthSales._count },
      year: { total: yearSales._sum.total || 0, count: yearSales._count },
      recent: recentSales
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAll, getOne, create, getSummary };
