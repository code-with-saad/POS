import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';

/** GET /api/users — List all staff members (Admin only) */
export async function getUsers(req, res, next) {
  try {
    const filter = {};
    if (req.user?.role !== 'superadmin' && req.user?.organization) {
      filter.organization = req.user.organization;
    }
    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: users });
  } catch (err) {
    next(err);
  }
}

/** POST /api/users — Create new cashier or admin user (Admin only) */
export async function createUser(req, res, next) {
  try {
    const { name, username, password, role, allowedModules } = req.body;

    if (!name || !username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, username, and password are required',
      });
    }

    const existingUser = await User.findOne({ username: username.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Username is already taken',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password.trim(), salt);

    const user = await User.create({
      name: name.trim(),
      username: username.toLowerCase().trim(),
      password: hashedPassword,
      role: role || 'cashier',
      organization: req.user.organization || null,
      allowedModules: Array.isArray(allowedModules) ? allowedModules : [],
      isActive: true,
    });

    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: userResponse,
    });
  } catch (err) {
    next(err);
  }
}

/** PUT /api/users/:id — Edit user details (Admin only) */
export async function updateUser(req, res, next) {
  try {
    const { id } = req.params;
    const { name, username, role, isActive, allowedModules } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check username uniqueness if changed
    if (username && username.toLowerCase().trim() !== user.username) {
      const existingUser = await User.findOne({ username: username.toLowerCase().trim() });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Username is already taken',
        });
      }
      user.username = username.toLowerCase().trim();
    }

    if (name) user.name = name.trim();
    if (role) user.role = role;
    if (Array.isArray(allowedModules)) user.allowedModules = allowedModules;
    if (typeof isActive === 'boolean') user.isActive = isActive;

    await user.save();

    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      success: true,
      message: 'User updated successfully',
      data: userResponse,
    });
  } catch (err) {
    next(err);
  }
}

/** PATCH /api/users/:id/reset-password — Reset password for a user (Admin only) */
export async function resetPassword(req, res, next) {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 4) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 4 characters long',
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({
      success: true,
      message: `Password reset successfully for ${user.username}`,
    });
  } catch (err) {
    next(err);
  }
}

/** DELETE /api/users/:id — Deactivate/delete user (Admin only) */
export async function deleteUser(req, res, next) {
  try {
    const { id } = req.params;

    // Prevent deleting self
    if (req.user.id === id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own admin account',
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await User.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'User account removed successfully',
    });
  } catch (err) {
    next(err);
  }
}
