const prisma = require('../utils/prisma');
const { deleteImage, uploadToS3 } = require('../middleware/upload.middleware');
const { generateSKU } = require('../utils/helpers');

const getAll = async (req, res, next) => {
  try {
    const {
      page = 1, limit = 20, search, categoryId,
      lowStock, sortBy = 'createdAt', sortOrder = 'desc'
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = { isActive: true };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { nameAr: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (categoryId) where.categoryId = categoryId;

    const validSortFields = ['name', 'quantity', 'sellingPrice', 'costPrice', 'createdAt'];
    const orderBy = validSortFields.includes(sortBy)
      ? { [sortBy]: sortOrder === 'asc' ? 'asc' : 'desc' }
      : { createdAt: 'desc' };

    const [abayas, total] = await Promise.all([
      prisma.abaya.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy,
        include: {
          category: { select: { id: true, name: true, nameAr: true } },
          images: { orderBy: { isPrimary: 'desc' } },
        },
      }),
      prisma.abaya.count({ where }),
    ]);

    const enriched = abayas.map(a => ({ ...a, isLowStock: a.quantity <= a.lowStockAlert }));

    res.json({
      data: enriched,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

const getOne = async (req, res, next) => {
  try {
    const abaya = await prisma.abaya.findUnique({
      where: { id: req.params.id, isActive: true },
      include: {
        category: true,
        images: { orderBy: { isPrimary: 'desc' } },
        stockLogs: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
    });
    if (!abaya) return res.status(404).json({ error: 'Abaya not found.' });
    res.json({ ...abaya, isLowStock: abaya.quantity <= abaya.lowStockAlert });
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const { name, nameAr, description, categoryId, quantity, costPrice, sellingPrice, lowStockAlert } = req.body;

    if (!name || !categoryId || quantity === undefined || !costPrice || !sellingPrice) {
      return res.status(400).json({ error: 'Name, category, quantity, cost price, and selling price are required.' });
    }

    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) return res.status(400).json({ error: 'Invalid category.' });

    const sku = generateSKU(name, category.name);

    // Upload images to S3
    const uploadedImages = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const result = await uploadToS3(file, 'products');
        uploadedImages.push(result);
      }
    }

    const abaya = await prisma.$transaction(async (tx) => {
      const newAbaya = await tx.abaya.create({
        data: {
          name: name.trim(),
          nameAr: nameAr?.trim() || null,
          description: description?.trim() || null,
          categoryId,
          quantity: parseInt(quantity),
          costPrice: parseFloat(costPrice),
          sellingPrice: parseFloat(sellingPrice),
          lowStockAlert: parseInt(lowStockAlert) || 5,
          sku,
        },
      });

      if (uploadedImages.length > 0) {
        await tx.abayaImage.createMany({
          data: uploadedImages.map((img, index) => ({
            abayaId: newAbaya.id,
            url: img.url,
            publicId: img.key,
            isPrimary: index === 0,
          })),
        });
      }

      if (parseInt(quantity) > 0) {
        await tx.stockLog.create({
          data: {
            abayaId: newAbaya.id,
            change: parseInt(quantity),
            reason: 'Initial stock',
            before: 0,
            after: parseInt(quantity),
          },
        });
      }

      return newAbaya;
    });

    const full = await prisma.abaya.findUnique({
      where: { id: abaya.id },
      include: { category: true, images: true },
    });

    res.status(201).json(full);
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, nameAr, description, categoryId, quantity, costPrice, sellingPrice, lowStockAlert } = req.body;

    const existing = await prisma.abaya.findUnique({ where: { id, isActive: true } });
    if (!existing) return res.status(404).json({ error: 'Abaya not found.' });

    // Upload new images to S3
    const uploadedImages = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const result = await uploadToS3(file, 'products');
        uploadedImages.push(result);
      }
    }

    const newQuantity = quantity !== undefined ? parseInt(quantity) : undefined;

    await prisma.$transaction(async (tx) => {
      await tx.abaya.update({
        where: { id },
        data: {
          ...(name && { name: name.trim() }),
          ...(nameAr !== undefined && { nameAr: nameAr?.trim() || null }),
          ...(description !== undefined && { description: description?.trim() || null }),
          ...(categoryId && { categoryId }),
          ...(newQuantity !== undefined && { quantity: newQuantity }),
          ...(costPrice && { costPrice: parseFloat(costPrice) }),
          ...(sellingPrice && { sellingPrice: parseFloat(sellingPrice) }),
          ...(lowStockAlert !== undefined && { lowStockAlert: parseInt(lowStockAlert) }),
        },
      });

      if (newQuantity !== undefined && newQuantity !== existing.quantity) {
        await tx.stockLog.create({
          data: {
            abayaId: id,
            change: newQuantity - existing.quantity,
            reason: 'Manual adjustment',
            before: existing.quantity,
            after: newQuantity,
          },
        });
      }

      if (uploadedImages.length > 0) {
        const existingCount = await tx.abayaImage.count({ where: { abayaId: id } });
        await tx.abayaImage.createMany({
          data: uploadedImages.map((img, index) => ({
            abayaId: id,
            url: img.url,
            publicId: img.key,
            isPrimary: existingCount === 0 && index === 0,
          })),
        });
      }
    });

    const full = await prisma.abaya.findUnique({
      where: { id },
      include: { category: true, images: true },
    });

    res.json(full);
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const { id } = req.params;

    const abaya = await prisma.abaya.findUnique({
      where: { id },
      include: { images: true, saleItems: { take: 1 } },
    });
    if (!abaya) return res.status(404).json({ error: 'Abaya not found.' });

    if (abaya.saleItems.length > 0) {
      await prisma.abaya.update({ where: { id }, data: { isActive: false } });
    } else {
      for (const image of abaya.images) {
        if (image.publicId) await deleteImage(image.publicId);
      }
      await prisma.abaya.delete({ where: { id } });
    }

    res.json({ message: 'Abaya deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

const deleteAbayaImage = async (req, res, next) => {
  try {
    const { id, imageId } = req.params;

    const image = await prisma.abayaImage.findFirst({
      where: { id: imageId, abayaId: id },
    });
    if (!image) return res.status(404).json({ error: 'Image not found.' });

    if (image.publicId) await deleteImage(image.publicId);
    await prisma.abayaImage.delete({ where: { id: imageId } });

    if (image.isPrimary) {
      const nextImg = await prisma.abayaImage.findFirst({ where: { abayaId: id } });
      if (nextImg) await prisma.abayaImage.update({ where: { id: nextImg.id }, data: { isPrimary: true } });
    }

    res.json({ message: 'Image deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

const getLowStock = async (req, res, next) => {
  try {
    const abayas = await prisma.abaya.findMany({
      where: { isActive: true },
      include: {
        category: { select: { name: true } },
        images: { where: { isPrimary: true }, take: 1 },
      },
      orderBy: { quantity: 'asc' },
    });

    const lowStock = abayas.filter(a => a.quantity <= a.lowStockAlert);
    res.json({ data: lowStock, count: lowStock.length });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAll, getOne, create, update, remove, deleteImage: deleteAbayaImage, getLowStock };
