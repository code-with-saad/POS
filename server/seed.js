import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { connectDB } from './config/db.js';
import { User } from './models/User.js';
import { Category } from './models/Category.js';
import { MenuItem } from './models/MenuItem.js';
import { Table } from './models/Table.js';
import { Order } from './models/Order.js';
import { Settings } from './models/Settings.js';
import { Customer } from './models/Customer.js';
import { Supplier } from './models/Supplier.js';
import { Inventory } from './models/Inventory.js';
import { Purchase } from './models/Purchase.js';

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
      Customer.deleteMany({}),
      Supplier.deleteMany({}),
      Inventory.deleteMany({}),
      Purchase.deleteMany({}),
    ]);

    // ── Users ──────────────────────────────────────────────────────
    console.log('Seeding Users...');
    const [adminHash, cashierHash, kitchenHash] = await Promise.all([
      bcrypt.hash('admin123', 10),
      bcrypt.hash('cashier123', 10),
      bcrypt.hash('kitchen123', 10),
    ]);

    const admin = await User.create({ name: 'System Admin', username: 'admin', password: adminHash, role: 'admin', isActive: true });
    const cashier = await User.create({ name: 'Ahmed (Cashier)', username: 'cashier', password: cashierHash, role: 'cashier', isActive: true });
    await User.create({ name: 'Kitchen Staff', username: 'kitchen', password: kitchenHash, role: 'kitchen', isActive: true });

    // ── Categories ────────────────────────────────────────────────
    console.log('Seeding Categories...');
    const cats = await Category.insertMany([
      { name: 'Hot Beverages', sortOrder: 1 },
      { name: 'Cold Beverages', sortOrder: 2 },
      { name: 'Fast Food', sortOrder: 3 },
      { name: 'Desserts', sortOrder: 4 },
    ]);
    const C = Object.fromEntries(cats.map(c => [c.name, c._id]));

    // ── Menu Items ────────────────────────────────────────────────
    console.log('Seeding Menu Items...');
    await MenuItem.insertMany([
      { name: 'Espresso', description: 'Rich single shot espresso', price: 350, category: C['Hot Beverages'], isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?auto=format&fit=crop&w=400&q=80' },
      { name: 'Cappuccino', description: 'Espresso topped with steamed milk foam', price: 480, category: C['Hot Beverages'], isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?auto=format&fit=crop&w=400&q=80' },
      { name: 'Karak Chai', description: 'Strong traditional Pakistani spiced tea', price: 180, category: C['Hot Beverages'], isAvailable: true },
      { name: 'Iced Latte', description: 'Chilled espresso with fresh milk over ice', price: 520, category: C['Cold Beverages'], isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=400&q=80' },
      { name: 'Mint Margarita', description: 'Refreshing mint and lemon slush', price: 390, category: C['Cold Beverages'], isAvailable: true },
      { name: 'Peach Iced Tea', description: 'Fresh black tea infused with peach syrup', price: 420, category: C['Cold Beverages'], isAvailable: true },
      {
        name: 'Zinger Burger',
        description: 'Crispy fried chicken fillet with mayo and lettuce',
        price: 500,
        originalPrice: 680,
        isDeal: true,
        category: C['Fast Food'],
        isAvailable: true,
        imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80',
      },
      { name: 'Club Sandwich', description: 'Triple decker chicken, egg and cheese sandwich', price: 750, category: C['Fast Food'], isAvailable: true },
      {
        name: 'Loaded Fries',
        description: 'Crispy fries with cheese sauce & jalapenos — Happy Hour Deal!',
        price: 420,
        originalPrice: 550,
        isDeal: true,
        category: C['Fast Food'],
        isAvailable: true,
        imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=400&q=80',
      },
      { name: 'Chicken Margherita Pizza', description: 'Fresh mozzarella, tomato sauce & grilled chicken', price: 990, category: C['Fast Food'], isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=400&q=80' },
      {
        name: 'Rabri Kheer',
        description: 'Traditional rich creamy rabri kheer dessert',
        price: 350,
        category: C['Desserts'],
        isAvailable: true,
        variants: [{ name: 'Single Portion', price: 350 }, { name: 'Half Kg', price: 650 }, { name: 'Full Kg', price: 1200 }],
      },
      {
        name: 'Special Cold Coffee',
        description: 'Blended espresso shake with ice cream',
        price: 450,
        category: C['Cold Beverages'],
        isAvailable: true,
        variants: [{ name: 'Regular (350ml)', price: 450 }, { name: 'Large (500ml)', price: 600 }],
      },
      { name: 'Chocolate Lava Cake', description: 'Warm cake with gooey chocolate center', price: 580, category: C['Desserts'], isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=400&q=80' },
    ]);

    // ── Tables ────────────────────────────────────────────────────
    console.log('Seeding Tables...');
    await Table.insertMany([
      { name: 'T1', section: 'Main Hall', capacity: 2, status: 'available' },
      { name: 'T2', section: 'Main Hall', capacity: 4, status: 'available' },
      { name: 'T3', section: 'Main Hall', capacity: 4, status: 'available' },
      { name: 'T4', section: 'Main Hall', capacity: 6, status: 'available' },
      { name: 'T5', section: 'Outdoor Terrace', capacity: 4, status: 'available' },
      { name: 'T6', section: 'Outdoor Terrace', capacity: 2, status: 'available' },
    ]);

    // ── Settings ──────────────────────────────────────────────────
    console.log('Seeding Settings...');
    await Settings.create({
      restaurantName: 'CafePOS',
      address: 'Main Boulevard, Gulberg III, Lahore, Pakistan',
      phone: '+92 42 111 222 333',
      taxRatePercent: 16,
      receiptFooter: 'Thank you for dining with us! Visit again soon.',
    });

    // ── Suppliers ─────────────────────────────────────────────────
    console.log('Seeding Suppliers...');
    const suppliers = await Supplier.insertMany([
      {
        name: 'Packages Dairy Farm',
        contactPerson: 'Ali Raza',
        phone: '0321-4567890',
        email: 'ali@packagesdairy.pk',
        address: 'Sheikhupura Road, Lahore',
        categoryProvided: 'Dairy (Milk, Cream)',
        balance: 12500,
        notes: 'Delivery every Monday & Thursday. COD preferred.',
      },
      {
        name: 'Metro Cash & Carry',
        contactPerson: 'Zara Khan',
        phone: '0300-1234567',
        email: 'zara@metro.pk',
        address: 'Johar Town, Lahore',
        categoryProvided: 'Dry Goods, Packaging',
        balance: 0,
        notes: '30-day credit terms. Invoice every month.',
      },
      {
        name: 'Al-Fatah Poultry',
        contactPerson: 'Tariq Butt',
        phone: '0333-9876543',
        email: 'tariq@alfatah.pk',
        address: 'Raiwind Road, Lahore',
        categoryProvided: 'Chicken & Meat',
        balance: 8000,
        notes: 'Fresh delivery daily morning 7am.',
      },
    ]);
    const [dairySupplier, metroSupplier, poultrySupplier] = suppliers;

    // ── Inventory ─────────────────────────────────────────────────
    console.log('Seeding Inventory...');
    const inventory = await Inventory.insertMany([
      {
        name: 'Full Cream Milk',
        sku: 'MLK-001',
        category: 'Dairy',
        unit: 'l',
        quantity: 40,
        minStockAlert: 10,
        costPrice: 180,
        supplier: dairySupplier._id,
        notes: 'Used for cappuccino, chai, cold coffee',
      },
      {
        name: 'Espresso Beans (Arabica)',
        sku: 'BEA-001',
        category: 'Coffee',
        unit: 'kg',
        quantity: 8,
        minStockAlert: 2,
        costPrice: 2200,
        supplier: metroSupplier._id,
        notes: '1kg makes ~100 espresso shots',
      },
      {
        name: 'Chicken Fillet (Zinger)',
        sku: 'CHK-001',
        category: 'Chicken & Meat',
        unit: 'kg',
        quantity: 15,
        minStockAlert: 5,
        costPrice: 750,
        supplier: poultrySupplier._id,
        notes: 'Used for Zinger Burger – ~200g per burger',
      },
      {
        name: 'Frozen Fries',
        sku: 'FRI-001',
        category: 'Frozen',
        unit: 'kg',
        quantity: 20,
        minStockAlert: 5,
        costPrice: 320,
        supplier: metroSupplier._id,
        notes: 'Loaded Fries uses ~150g per serving',
      },
      {
        name: 'Mozzarella Cheese',
        sku: 'CHS-001',
        category: 'Dairy',
        unit: 'kg',
        quantity: 6,
        minStockAlert: 2,
        costPrice: 1800,
        supplier: dairySupplier._id,
        notes: 'Used for pizza and loaded fries',
      },
      {
        name: 'Disposable Cups (12oz)',
        sku: 'PKG-001',
        category: 'Packaging',
        unit: 'pcs',
        quantity: 500,
        minStockAlert: 100,
        costPrice: 12,
        supplier: metroSupplier._id,
        notes: 'Hot beverages takeaway cups',
      },
      {
        name: 'Sugar',
        sku: 'DRY-001',
        category: 'Dry Goods',
        unit: 'kg',
        quantity: 25,
        minStockAlert: 5,
        costPrice: 140,
        supplier: metroSupplier._id,
      },
    ]);

    // ── Purchase Orders ───────────────────────────────────────────
    console.log('Seeding Purchase Orders...');
    await Purchase.insertMany([
      {
        purchaseNumber: 'PO-00001',
        supplier: dairySupplier._id,
        items: [
          { itemName: 'Full Cream Milk', quantity: 40, unit: 'l', unitCost: 180, totalCost: 7200 },
          { itemName: 'Mozzarella Cheese', quantity: 6, unit: 'kg', unitCost: 1800, totalCost: 10800 },
        ],
        totalAmount: 18000,
        paidAmount: 5500,
        paymentStatus: 'partial',
        notes: 'Weekly dairy delivery',
      },
      {
        purchaseNumber: 'PO-00002',
        supplier: metroSupplier._id,
        items: [
          { itemName: 'Espresso Beans (Arabica)', quantity: 8, unit: 'kg', unitCost: 2200, totalCost: 17600 },
          { itemName: 'Frozen Fries', quantity: 20, unit: 'kg', unitCost: 320, totalCost: 6400 },
          { itemName: 'Disposable Cups (12oz)', quantity: 500, unit: 'pcs', unitCost: 12, totalCost: 6000 },
          { itemName: 'Sugar', quantity: 25, unit: 'kg', unitCost: 140, totalCost: 3500 },
        ],
        totalAmount: 33500,
        paidAmount: 33500,
        paymentStatus: 'paid',
        notes: 'Monthly dry goods run from Metro',
      },
      {
        purchaseNumber: 'PO-00003',
        supplier: poultrySupplier._id,
        items: [
          { itemName: 'Chicken Fillet (Zinger)', quantity: 15, unit: 'kg', unitCost: 750, totalCost: 11250 },
        ],
        totalAmount: 11250,
        paidAmount: 3250,
        paymentStatus: 'partial',
        notes: 'Daily poultry fresh delivery',
      },
    ]);

    // ── Customers ─────────────────────────────────────────────────
    console.log('Seeding Customers...');
    await Customer.insertMany([
      {
        name: 'Saad Kashif',
        phone: '0300-1111111',
        email: 'saad@example.com',
        address: 'DHA Phase 5, Lahore',
        totalOrders: 12,
        totalSpent: 18450,
        loyaltyPoints: 184,
        notes: 'Regular customer. Prefers Zinger Burger & Iced Latte.',
      },
      {
        name: 'Amna Farooq',
        phone: '0311-2222222',
        email: 'amna@example.com',
        address: 'Gulberg II, Lahore',
        totalOrders: 7,
        totalSpent: 9800,
        loyaltyPoints: 98,
        notes: 'Prefers takeaway. Always orders Cappuccino.',
      },
      {
        name: 'Omar Siddiqui',
        phone: '0333-3333333',
        email: 'omar@example.com',
        address: 'Johar Town, Lahore',
        totalOrders: 3,
        totalSpent: 4200,
        loyaltyPoints: 42,
        notes: 'Corporate client. Bulk orders on Fridays.',
      },
    ]);

    console.log('');
    console.log('🎉 Seeding completed successfully!');
    console.log('───────────────────────────────────────');
    console.log('  Login Credentials:');
    console.log(`  Admin:   username="admin"   password="admin123"`);
    console.log(`  Cashier: username="cashier" password="cashier123"`);
    console.log(`  Kitchen: username="kitchen" password="kitchen123"`);
    console.log('───────────────────────────────────────');
    console.log('  Demo Data Seeded:');
    console.log('  ✓ 3 users (admin, cashier, kitchen)');
    console.log('  ✓ 4 categories, 13 menu items (2 deals)');
    console.log('  ✓ 6 tables');
    console.log('  ✓ 3 suppliers');
    console.log('  ✓ 7 inventory items');
    console.log('  ✓ 3 purchase orders');
    console.log('  ✓ 3 customers');
    console.log('');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();
