const XLSX = require('xlsx');
const prisma = require('../utils/prisma');
const { generateSKU } = require('../utils/helpers');

const REQUIRED_COLUMNS = ['name', 'category', 'quantity', 'cost_price', 'selling_price'];
const OPTIONAL_COLUMNS = ['name_ar', 'description', 'low_stock_alert'];

const validateRow = (row, index, categoryNames) => {
  const errors = [];
  const rowNum = index + 2; // +2: header row + 1-indexed

  if (!row.name?.toString().trim()) {
    errors.push(`Row ${rowNum}: Name is required.`);
  }

  if (!row.category?.toString().trim()) {
    errors.push(`Row ${rowNum}: Category is required.`);
  } else if (!categoryNames.map(c => c.toLowerCase()).includes(row.category.toString().toLowerCase().trim())) {
    errors.push(`Row ${rowNum}: Category "${row.category}" not found. Available: ${categoryNames.join(', ')}.`);
  }

  const qty = parseInt(row.quantity);
  if (isNaN(qty) || qty < 0) {
    errors.push(`Row ${rowNum}: Quantity must be a non-negative number.`);
  }

  const costPrice = parseFloat(row.cost_price);
  if (isNaN(costPrice) || costPrice < 0) {
    errors.push(`Row ${rowNum}: Cost price must be a valid positive number.`);
  }

  const sellingPrice = parseFloat(row.selling_price);
  if (isNaN(sellingPrice) || sellingPrice < 0) {
    errors.push(`Row ${rowNum}: Selling price must be a valid positive number.`);
  }

  if (!isNaN(costPrice) && !isNaN(sellingPrice) && sellingPrice < costPrice) {
    // Warning, not error
  }

  return errors;
};

const preview = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json(sheet, { raw: false, defval: '' });

    if (rawData.length === 0) {
      return res.status(400).json({ error: 'The uploaded file is empty.' });
    }

    // Normalize column names (lowercase, trim, replace spaces with _)
    const normalized = rawData.map(row => {
      const newRow = {};
      Object.keys(row).forEach(key => {
        const normalizedKey = key.toLowerCase().trim().replace(/\s+/g, '_');
        newRow[normalizedKey] = row[key];
      });
      return newRow;
    });

    // Check required columns
    const firstRow = normalized[0];
    const missingColumns = REQUIRED_COLUMNS.filter(col => !(col in firstRow));
    if (missingColumns.length > 0) {
      return res.status(400).json({
        error: `Missing required columns: ${missingColumns.join(', ')}. Please use the template.`,
        missingColumns
      });
    }

    // Get existing categories
    const categories = await prisma.category.findMany();
    const categoryMap = Object.fromEntries(categories.map(c => [c.name.toLowerCase(), c]));
    const categoryNames = categories.map(c => c.name);

    const validRows = [];
    const invalidRows = [];

    normalized.forEach((row, index) => {
      const errors = validateRow(row, index, categoryNames);
      const category = categoryMap[row.category?.toString().toLowerCase().trim()];
      
      const processed = {
        rowNumber: index + 2,
        name: row.name?.toString().trim(),
        nameAr: row.name_ar?.toString().trim() || null,
        description: row.description?.toString().trim() || null,
        category: row.category?.toString().trim(),
        categoryId: category?.id,
        quantity: parseInt(row.quantity),
        costPrice: parseFloat(row.cost_price),
        sellingPrice: parseFloat(row.selling_price),
        lowStockAlert: parseInt(row.low_stock_alert) || 5
      };

      if (errors.length > 0) {
        invalidRows.push({ ...processed, errors });
      } else {
        validRows.push(processed);
      }
    });

    res.json({
      total: normalized.length,
      valid: validRows.length,
      invalid: invalidRows.length,
      validRows,
      invalidRows,
      canImport: validRows.length > 0
    });
  } catch (error) {
    if (error.message?.includes('CFB')) {
      return res.status(400).json({ error: 'Could not read file. Please ensure it is a valid Excel (.xlsx) or CSV file.' });
    }
    next(error);
  }
};

const importData = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json(sheet, { raw: false, defval: '' });

    const normalized = rawData.map(row => {
      const newRow = {};
      Object.keys(row).forEach(key => {
        newRow[key.toLowerCase().trim().replace(/\s+/g, '_')] = row[key];
      });
      return newRow;
    });

    const categories = await prisma.category.findMany();
    const categoryMap = Object.fromEntries(categories.map(c => [c.name.toLowerCase(), c]));
    const categoryNames = categories.map(c => c.name);

    const toInsert = [];
    const errors = [];

    normalized.forEach((row, index) => {
      const rowErrors = validateRow(row, index, categoryNames);
      if (rowErrors.length === 0) {
        const category = categoryMap[row.category?.toString().toLowerCase().trim()];
        toInsert.push({
          name: row.name.toString().trim(),
          nameAr: row.name_ar?.toString().trim() || null,
          description: row.description?.toString().trim() || null,
          categoryId: category.id,
          quantity: parseInt(row.quantity),
          costPrice: parseFloat(row.cost_price),
          sellingPrice: parseFloat(row.selling_price),
          lowStockAlert: parseInt(row.low_stock_alert) || 5,
          sku: generateSKU(row.name, category.name) + '_' + Date.now() + '_' + index
        });
      } else {
        errors.push({ row: index + 2, errors: rowErrors });
      }
    });

    if (toInsert.length === 0) {
      return res.status(400).json({ 
        error: 'No valid rows to import.',
        errors 
      });
    }

    // Bulk insert
    const result = await prisma.$transaction(
      toInsert.map(item => prisma.abaya.create({ data: item }))
    );

    // Create stock logs
    await prisma.stockLog.createMany({
      data: result.map(abaya => ({
        abayaId: abaya.id,
        change: abaya.quantity,
        reason: 'Bulk import',
        before: 0,
        after: abaya.quantity
      }))
    });

    res.json({
      message: `Successfully imported ${result.length} abayas.`,
      imported: result.length,
      skipped: errors.length,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    next(error);
  }
};

const downloadTemplate = (req, res) => {
  const wb = XLSX.utils.book_new();
  
  // Instructions sheet
  const instructions = [
    ['Abaya Store Import Template'],
    [''],
    ['INSTRUCTIONS:'],
    ['1. Do not delete or rename any column headers in the "Import Data" sheet.'],
    ['2. Required fields: name, category, quantity, cost_price, selling_price'],
    ['3. Optional fields: name_ar (Arabic name), description, low_stock_alert'],
    ['4. Category must match exactly one of the categories in the system.'],
    ['5. Prices must be numbers (e.g., 150.00)'],
    ['6. Quantity must be a whole number (e.g., 10)'],
    ['7. Delete these instructions before importing (use the Import Data sheet).'],
  ];
  const wsInstructions = XLSX.utils.aoa_to_sheet(instructions);
  wsInstructions['!cols'] = [{ wch: 80 }];
  XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instructions');

  // Main data sheet
  const headers = [
    ['name', 'name_ar', 'category', 'quantity', 'cost_price', 'selling_price', 'description', 'low_stock_alert'],
    // Sample rows
    ['Classic Black Abaya', 'عباية سوداء كلاسيكية', 'Classic', 20, 80, 150, 'Elegant classic black abaya with embroidery', 5],
    ['Modern Open Abaya', 'عباية مفتوحة عصرية', 'Modern', 15, 120, 220, 'Trendy open-style abaya for casual wear', 3],
    ['Luxury Pearl Abaya', 'عباية لؤلؤية فاخرة', 'Luxury', 8, 300, 650, 'Premium luxury abaya with pearl details', 2],
  ];

  const ws = XLSX.utils.aoa_to_sheet(headers);
  
  ws['!cols'] = [
    { wch: 25 }, { wch: 25 }, { wch: 15 }, { wch: 12 },
    { wch: 12 }, { wch: 15 }, { wch: 40 }, { wch: 18 }
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Import Data');

  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  res.setHeader('Content-Disposition', 'attachment; filename=abaya_import_template.xlsx');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(buffer);
};

module.exports = { preview, importData, downloadTemplate };
