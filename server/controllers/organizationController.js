import { Organization } from '../models/Organization.js';
import { User } from '../models/User.js';
import bcrypt from 'bcryptjs';

/** GET /api/organizations - List all organizations */
export async function getOrganizations(req, res, next) {
  try {
    const orgs = await Organization.find().sort({ createdAt: -1 });
    res.json({ success: true, data: orgs });
  } catch (err) {
    next(err);
  }
}

/** POST /api/organizations - Create new organization & its initial Admin user */
export async function createOrganization(req, res, next) {
  try {
    const { name, slug, ownerName, phone, email, adminUsername, adminPassword } = req.body;

    if (!name || !adminUsername || !adminPassword) {
      return res.status(400).json({ success: false, message: 'Name, admin username, and admin password are required' });
    }

    const orgSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const existingOrg = await Organization.findOne({ slug: orgSlug });
    if (existingOrg) {
      return res.status(400).json({ success: false, message: 'Organization slug or name already exists' });
    }

    const existingUser = await User.findOne({ username: adminUsername.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Admin username already taken' });
    }

    // Create Organization
    const organization = await Organization.create({
      name,
      slug: orgSlug,
      ownerName: ownerName || '',
      phone: phone || '',
      email: email || '',
    });

    // Create Org Admin User
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    const adminUser = await User.create({
      name: ownerName ? `${ownerName} (Admin)` : `${name} Admin`,
      username: adminUsername.toLowerCase(),
      password: hashedPassword,
      role: 'admin',
      organization: organization._id,
      isActive: true,
    });

    res.status(201).json({
      success: true,
      data: {
        organization,
        adminUser: {
          id: adminUser._id,
          username: adminUser.username,
          name: adminUser.name,
          role: adminUser.role,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}
