require('dotenv').config();
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create users
  const adminPassword = await bcrypt.hash('Admin@2024', 12);
  const staffPassword = await bcrypt.hash('Staff@2024', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'mohammad@abayastore.com' },
    update: {},
    create: {
      name: 'Mohammad',
      email: 'mohammad@abayastore.com',
      password: adminPassword,
      role: 'ADMIN'
    }
  });

  const staff = await prisma.user.upsert({
    where: { email: 'shatha@abayastore.com' },
    update: {},
    create: {
      name: 'Shatha',
      email: 'shatha@abayastore.com',
      password: staffPassword,
      role: 'STAFF'
    }
  });

  console.log('✅ Users created:', admin.name, '(Admin),', staff.name, '(Staff)');

  // Categories
  const categoryData = [
    { name: 'Classic', nameAr: 'كلاسيك' },
    { name: 'Modern', nameAr: 'عصري' },
    { name: 'Luxury', nameAr: 'فاخر' },
    { name: 'Casual', nameAr: 'كاجوال' },
    { name: 'Embroidered', nameAr: 'مطرز' },
    { name: 'Kids', nameAr: 'أطفال' }
  ];

  const categories = {};
  for (const cat of categoryData) {
    const c = await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: cat
    });
    categories[cat.name] = c;
  }

  console.log('✅ Categories created');

  // Sample abayas
  const abayaData = [
    { name: 'Classic Black Abaya', nameAr: 'عباية سوداء كلاسيكية', categoryName: 'Classic', quantity: 25, costPrice: 80, sellingPrice: 150 },
    { name: 'Modern Open Abaya', nameAr: 'عباية مفتوحة عصرية', categoryName: 'Modern', quantity: 15, costPrice: 120, sellingPrice: 250 },
    { name: 'Luxury Pearl Abaya', nameAr: 'عباية لؤلؤية فاخرة', categoryName: 'Luxury', quantity: 8, costPrice: 350, sellingPrice: 750 },
    { name: 'Casual Linen Abaya', nameAr: 'عباية كتانية كاجوال', categoryName: 'Casual', quantity: 3, costPrice: 90, sellingPrice: 180 },
    { name: 'Golden Embroidered Abaya', nameAr: 'عباية مطرزة ذهبية', categoryName: 'Embroidered', quantity: 12, costPrice: 200, sellingPrice: 420 },
    { name: 'Kids Pink Abaya', nameAr: 'عباية أطفال وردية', categoryName: 'Kids', quantity: 20, costPrice: 50, sellingPrice: 100 },
    { name: 'Premium Nida Abaya', nameAr: 'عباية نيدا بريميوم', categoryName: 'Luxury', quantity: 2, costPrice: 450, sellingPrice: 950 },
    { name: 'Butterfly Abaya', nameAr: 'عباية فراشة', categoryName: 'Modern', quantity: 18, costPrice: 100, sellingPrice: 200 }
  ];

  for (const data of abayaData) {
    const { categoryName, ...rest } = data;
    await prisma.abaya.upsert({
      where: { sku: `SEED-${data.name.replace(/\s/g, '')}` },
      update: {},
      create: {
        ...rest,
        sku: `SEED-${data.name.replace(/\s/g, '')}`,
        categoryId: categories[categoryName].id,
        costPrice: rest.costPrice,
        sellingPrice: rest.sellingPrice,
        lowStockAlert: 5
      }
    });
  }

  console.log('✅ Sample abayas created');

  // Sample expenses
  const expenseData = [
    { category: 'RENT', description: 'Monthly store rent', amount: 5000 },
    { category: 'UTILITIES', description: 'Electricity & internet', amount: 450 },
    { category: 'SHIPPING', description: 'DHL shipping for supplier orders', amount: 320 },
    { category: 'MARKETING', description: 'Instagram ads campaign', amount: 800 },
    { category: 'SUPPLIES', description: 'Packaging & shopping bags', amount: 200 }
  ];

  for (const exp of expenseData) {
    await prisma.expense.create({
      data: {
        userId: admin.id,
        category: exp.category,
        description: exp.description,
        amount: exp.amount,
        date: new Date()
      }
    });
  }

  console.log('✅ Sample expenses created');
  console.log('\n✨ Seed complete!');
  console.log('\n👤 Login credentials:');
  console.log('   Mohammad (Admin): mohammad@abayastore.com / Admin@2024');
  console.log('   Shatha (Staff):   shatha@abayastore.com  / Staff@2024');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
