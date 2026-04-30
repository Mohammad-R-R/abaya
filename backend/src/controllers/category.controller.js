const prisma = require('../utils/prisma');

const getAll = async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { abayas: { where: { isActive: true } } } } }
    });
    res.json(categories);
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const { name, nameAr } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Category name is required.' });

    const category = await prisma.category.create({
      data: { name: name.trim(), nameAr: nameAr?.trim() }
    });
    res.status(201).json(category);
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const { name, nameAr } = req.body;
    const category = await prisma.category.update({
      where: { id: req.params.id },
      data: { ...(name && { name: name.trim() }), ...(nameAr !== undefined && { nameAr: nameAr?.trim() }) }
    });
    res.json(category);
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const count = await prisma.abaya.count({
      where: { categoryId: req.params.id, isActive: true }
    });
    if (count > 0) {
      return res.status(400).json({ error: `Cannot delete. ${count} abayas use this category.` });
    }
    await prisma.category.delete({ where: { id: req.params.id } });
    res.json({ message: 'Category deleted.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAll, create, update, remove };
