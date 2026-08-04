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
    const { name, slug, ownerName, phone, email, plan, adminUsername, adminPassword } = req.body;

    if (!name || !adminUsername || !adminPassword) {
      return res.status(400).json({ success: false, message: 'Name, admin username, and admin password are required' });
    }

    const cleanAdminUsername = String(adminUsername).toLowerCase().trim();
    const cleanAdminPassword = String(adminPassword).trim();

    const orgSlug = slug
      ? String(slug).toLowerCase().trim()
      : name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const existingOrg = await Organization.findOne({ slug: orgSlug });
    if (existingOrg) {
      return res.status(400).json({ success: false, message: 'Organization slug or name already exists' });
    }

    const existingUser = await User.findOne({ username: cleanAdminUsername });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Admin username already taken' });
    }

    // Create Organization
    const organization = await Organization.create({
      name: name.trim(),
      slug: orgSlug,
      ownerName: ownerName ? ownerName.trim() : '',
      phone: phone ? phone.trim() : '',
      email: email ? email.trim() : '',
      plan: plan || 'pro',
      isActive: true,
    });

    // Create Org Admin User
    const hashedPassword = await bcrypt.hash(cleanAdminPassword, 10);
    const adminUser = await User.create({
      name: ownerName ? `${ownerName.trim()} (Admin)` : `${name.trim()} Admin`,
      username: cleanAdminUsername,
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

/** PUT /api/organizations/:id - Update existing organization */
export async function updateOrganization(req, res, next) {
  try {
    const { name, slug, ownerName, phone, email, plan, isActive } = req.body;
    const org = await Organization.findById(req.params.id);
    if (!org) {
      return res.status(404).json({ success: false, message: 'Organization not found' });
    }

    if (name) org.name = name;
    if (slug) org.slug = slug;
    if (ownerName !== undefined) org.ownerName = ownerName;
    if (phone !== undefined) org.phone = phone;
    if (email !== undefined) org.email = email;
    if (plan) org.plan = plan;
    if (isActive !== undefined) org.isActive = isActive;

    await org.save();
    res.json({ success: true, data: org });
  } catch (err) {
    next(err);
  }
}

/** DELETE /api/organizations/:id - Delete an organization */
export async function deleteOrganization(req, res, next) {
  try {
    const org = await Organization.findByIdAndDelete(req.params.id);
    if (!org) {
      return res.status(404).json({ success: false, message: 'Organization not found' });
    }
    res.json({ success: true, message: 'Organization deleted' });
  } catch (err) {
    next(err);
  }
}
