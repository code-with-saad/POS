import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { signToken } from '../utils/jwt.js';

function safeUser(user) {
  const obj = user.toObject();
  delete obj.password;
  return obj;
}

/** POST /api/auth/login */
export async function login(req, res, next) {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required' });
    }

    const cleanUsername = String(username).toLowerCase().trim();
    const cleanPassword = String(password).trim();

    const user = await User.findOne({ username: cleanUsername }).populate('organization');
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (user.organization && user.organization.isActive === false) {
      return res.status(403).json({ success: false, message: 'Organization account is inactive. Please contact support.' });
    }

    const match = await bcrypt.compare(cleanPassword, user.password);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = signToken({ id: user._id, role: user.role });

    res.json({
      success: true,
      data: {
        token,
        user: safeUser(user),
      },
    });
  } catch (err) {
    next(err);
  }
}

/** GET /api/auth/me  — requires protect middleware */
export async function me(req, res) {
  res.json({ success: true, data: { user: safeUser(req.user) } });
}
