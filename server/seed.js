import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { connectDB } from './config/db.js';
import { User } from './models/User.js';
import { Category } from './models/Category.js';
import { MenuItem } from './models/MenuItem.js';
import { Table } from './models/Table.js';
import { Order } from './models/Order.js';
import { Settings } from './models/Settings.js';

async function seed() {
  try {
    console.log('Connecting to database...');
    await connectDB();

    console.log('Clearing existing data...');
    await Promise.all([
      User.deleteMany({}),
      Category.deleteMany({}),
      MenuItem.deleteMany({}),
      Table.deleteMany({}),
      Order.deleteMany({}),
      Settings.deleteMany({}),
    ]);

    console.log('Seeding Users...');
    const adminPasswordHash = await bcrypt.hash('admin123', 10);
    const cashierPasswordHash = await bcrypt.hash('cashier123', 10);

    const admin = await User.create({
      name: 'System Admin',
      username: 'admin',
      password: adminPasswordHash,
      role: 'admin',
      isActive: true,
    });

    const cashier = await User.create({
      name: 'John Cashier',
      username: 'cashier',
      password: cashierPasswordHash,
      role: 'cashier',
      isActive: true,
    });

    console.log('Seeding Categories...');
    const categories = await Category.insertMany([
      { name: 'Hot Beverages', sortOrder: 1 },
      { name: 'Cold Beverages', sortOrder: 2 },
      { name: 'Fast Food', sortOrder: 3 },
      { name: 'Desserts', sortOrder: 4 },
    ]);

    const catMap = {};
    categories.forEach((cat) => {
      catMap[cat.name] = cat._id;
    });

    console.log('Seeding Menu Items...');
    await MenuItem.insertMany([
      // Hot Beverages
      {
        name: 'Espresso',
        description: 'Rich single shot espresso',
        price: 350,
        category: catMap['Hot Beverages'],
        isAvailable: true,
      },
      {
        name: 'Cappuccino',
        description: 'Espresso topped with steamed milk foam',
        price: 480,
        category: catMap['Hot Beverages'],
        isAvailable: true,
      },
      {
        name: 'Karak Chai',
        description: 'Strong traditional Pakistani spiced tea',
        price: 180,
        category: catMap['Hot Beverages'],
        isAvailable: true,
      },
      // Cold Beverages
      {
        name: 'Iced Latte',
        description: 'Chilled espresso with fresh milk over ice',
        price: 520,
        category: catMap['Cold Beverages'],
        isAvailable: true,
      },
      {
        name: 'Mint Margarita',
        description: 'Refreshing mint and lemon slush',
        price: 390,
        category: catMap['Cold Beverages'],
        isAvailable: true,
      },
      {
        name: 'Peach Iced Tea',
        description: 'Fresh black tea infused with peach syrup',
        price: 420,
        category: catMap['Cold Beverages'],
        isAvailable: true,
      },
      // Fast Food
      {
        name: 'Club Sandwich',
        description: 'Triple decker chicken, egg, and cheese sandwich',
        price: 750,
        category: catMap['Fast Food'],
        isAvailable: true,
      },
      {
        name: 'Zinger Burger',
        description: 'Crispy fried chicken fillet with mayo and lettuce',
        price: 680,
        category: catMap['Fast Food'],
        isAvailable: true,
      },
      {
        name: 'Loaded Fries',
        description: 'Crispy fries topped with cheese sauce & jalapenos',
        price: 550,
        category: catMap['Fast Food'],
        isAvailable: true,
      },
      {
        name: 'Chicken Margherita Pizza (Personal)',
        description: 'Fresh mozzarella, tomato sauce & grilled chicken',
        price: 990,
        category: catMap['Fast Food'],
        isAvailable: true,
      },
      // Desserts
      {
        name: 'Chocolate Lava Cake',
        description: 'Warm cake with gooey chocolate center',
        price: 580,
        category: catMap['Desserts'],
        isAvailable: true,
      },
      {
        name: 'New York Cheesecake',
        description: 'Classic creamy cheesecake slice',
        price: 650,
        category: catMap['Desserts'],
        isAvailable: true,
      },
    ]);

    console.log('Seeding Tables...');
    await Table.insertMany([
      { name: 'T1', section: 'Main Hall', capacity: 2, status: 'available' },
      { name: 'T2', section: 'Main Hall', capacity: 4, status: 'available' },
      { name: 'T3', section: 'Main Hall', capacity: 4, status: 'available' },
      { name: 'T4', section: 'Main Hall', capacity: 6, status: 'available' },
      { name: 'T5', section: 'Outdoor Terrace', capacity: 4, status: 'available' },
      { name: 'T6', section: 'Outdoor Terrace', capacity: 2, status: 'available' },
    ]);

    console.log('Seeding Default Settings...');
    await Settings.create({
      restaurantName: 'CafePOS',
      address: 'Main Boulevard, Gulberg III, Lahore, Pakistan',
      phone: '+92 42 111 222 333',
      taxRatePercent: 16,
      receiptFooter: 'Thank you for dining with us! Visit again soon.',
    });

    console.log('🎉 Seeding completed successfully!');
    console.log('-----------------------------------');
    console.log('Seeded Credentials:');
    console.log(`Admin:   username = "${admin.username}", password = "admin123"`);
    console.log(`Cashier: username = "${cashier.username}", password = "cashier123"`);
    console.log('-----------------------------------');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();
