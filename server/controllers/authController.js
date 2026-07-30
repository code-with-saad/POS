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

    const user = await User.findOne({ username: username.toLowerCase().trim() });
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const match = await bcrypt.compare(password, user.password);
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
