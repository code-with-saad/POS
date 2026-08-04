/**
 * One-time fix: ensure superadmin user exists and create CafePOS org
 * Run: node fixSuperAdmin.js
 */
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

import { User } from './models/User.js';
import { Organization } from './models/Organization.js';

await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/cafepos');
console.log('Connected');

// 1. Ensure superadmin user
let sa = await User.findOne({ username: 'superadmin' });
if (!sa) {
  const hash = await bcrypt.hash('super123', 10);
  sa = await User.create({ name: 'Platform Owner', username: 'superadmin', password: hash, role: 'superadmin', isActive: true });
  console.log('✓ Created superadmin (password: super123)');
} else if (sa.role !== 'superadmin') {
  sa.role = 'superadmin';
  await sa.save();
  console.log('✓ Fixed superadmin role');
} else {
  console.log('✓ superadmin already correct');
}

// 2. Ensure CafePOS organization exists
let org = await Organization.findOne({ slug: 'cafepos' });
if (!org) {
  org = await Organization.create({
    name: 'CafePOS (Default)',
    slug: 'cafepos',
    ownerName: 'Admin',
    phone: '',
    email: '',
    plan: 'basic',
  });
  console.log('✓ Created CafePOS organization');
} else {
  console.log('✓ CafePOS org already exists:', org.name);
}

// 3. Make sure the existing admin user is linked to CafePOS org
const updated = await User.updateMany(
  { role: { $in: ['admin', 'manager', 'cashier', 'kitchen'] }, organization: null },
  { $set: { organization: org._id } }
);
console.log(`✓ Linked ${updated.modifiedCount} existing users to CafePOS org`);

console.log('\nAll done!');
console.log('  superadmin login → username: superadmin  password: super123');
await mongoose.disconnect();
process.exit(0);
