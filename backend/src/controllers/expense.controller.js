const prisma = require('../utils/prisma');

const getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, category, startDate, endDate } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (category) where.category = category;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.date.lte = end;
      }
    }

    const [expenses, total, summary] = await Promise.all([
      prisma.expense.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { date: 'desc' },
        include: { user: { select: { name: true } } }
      }),
      prisma.expense.count({ where }),
      prisma.expense.groupBy({
        by: ['category'],
        where,
        _sum: { amount: true }
      })
    ]);

    res.json({
      data: expenses,
      summary,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) }
    });
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const { category, description, amount, date } = req.body;

    if (!category || !description || !amount) {
      return res.status(400).json({ error: 'Category, description, and amount are required.' });
    }

    if (parseFloat(amount) <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0.' });
    }

    const expense = await prisma.expense.create({
      data: {
        userId: req.user.id,
        category,
        description: description.trim(),
        amount: parseFloat(amount),
        date: date ? new Date(date) : new Date(),
        receipt: req.file?.path
      },
      include: { user: { select: { name: true } } }
    });

    res.status(201).json(expense);
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { category, description, amount, date } = req.body;

    const expense = await prisma.expense.findUnique({ where: { id } });
    if (!expense) return res.status(404).json({ error: 'Expense not found.' });

    // Only admin or creator can edit
    if (req.user.role !== 'ADMIN' && expense.userId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to edit this expense.' });
    }

    const updated = await prisma.expense.update({
      where: { id },
      data: {
        ...(category && { category }),
        ...(description && { description: description.trim() }),
        ...(amount && { amount: parseFloat(amount) }),
        ...(date && { date: new Date(date) })
      },
      include: { user: { select: { name: true } } }
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const { id } = req.params;
    const expense = await prisma.expense.findUnique({ where: { id } });
    
    if (!expense) return res.status(404).json({ error: 'Expense not found.' });

    if (req.user.role !== 'ADMIN' && expense.userId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this expense.' });
    }

    await prisma.expense.delete({ where: { id } });
    res.json({ message: 'Expense deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAll, create, update, remove };
