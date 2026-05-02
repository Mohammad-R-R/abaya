const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function startupSeed() {
  try {
    // Check if already seeded
    const userCount = await prisma.user.count();
    if (userCount > 0) {
      console.log('✅ Database already seeded, skipping...');
      return;
    }

    console.log('🌱 First run detected — seeding database...');

    const adminPassword = await bcrypt.hash('Admin@2024', 12);
    const staffPassword = await bcrypt.hash('Staff@2024', 12);

    await prisma.user.createMany({
      data: [
        {
          name: 'Mohammad',
          email: 'mohammad@abayastore.com',
          password: adminPassword,
          role: 'ADMIN'
        },
        {
          name: 'Shatha',
          email: 'shatha@abayastore.com',
          password: staffPassword,
          role: 'STAFF'
        }
      ]
    });

    const categoryData = [
      { name: 'Classic', nameAr: 'كلاسيك' },
      { name: 'Modern', nameAr: 'عصري' },
      { name: 'Luxury', nameAr: 'فاخر' },
      { name: 'Casual', nameAr: 'كاجوال' },
      { name: 'Embroidered', nameAr: 'مطرز' },
      { name: 'Kids', nameAr: 'أطفال' }
    ];

    for (const cat of categoryData) {
      await prisma.category.upsert({
        where: { name: cat.name },
        update: {},
        create: cat
      });
    }

    console.log('✅ Users and categories created!');
    console.log('👤 Mohammad (Admin): mohammad@abayastore.com / Admin@2024');
    console.log('👤 Shatha (Staff):   shatha@abayastore.com  / Staff@2024');

  } catch (error) {
    console.error('Seed error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

module.exports = startupSeed;
