import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { eq, desc } from 'drizzle-orm';
import db, { isUsingNeon, localDb } from '../config/db.js';
import config from '../config/index.js';
import { users, adminConfig } from '../models/schema.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

// Helper: Generate JWT
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
};

// ─── Customer Register ───
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, phone, address } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (isUsingNeon && db) {
      const existing = await db.select().from(users).where(eq(users.email, normalizedEmail));
      if (existing.length > 0) {
        return res.status(409).json({ error: 'An account with this email already exists.' });
      }

      const passwordHash = await bcrypt.hash(password, 12);
      const [newUser] = await db.insert(users).values({
        email: normalizedEmail,
        passwordHash,
        name: name.trim(),
        phone: phone ? phone.trim() : null,
        address: address ? address.trim() : null,
        role: 'customer',
      }).returning();

      const token = generateToken(newUser);
      return res.status(201).json({
        token,
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
          phone: newUser.phone,
          address: newUser.address,
        },
      });
    } else {
      const existing = localDb.findOne('users', u => u.email === normalizedEmail);
      if (existing) {
        return res.status(409).json({ error: 'An account with this email already exists.' });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const newUser = localDb.insert('users', {
        email: normalizedEmail,
        passwordHash,
        name: name.trim(),
        phone: phone ? phone.trim() : null,
        address: address ? address.trim() : null,
        role: 'customer',
      });

      const token = generateToken(newUser);
      return res.status(201).json({
        token,
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
          phone: newUser.phone,
          address: newUser.address,
        },
      });
    }
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

// ─── Customer Login ───
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    let user = null;

    if (isUsingNeon && db) {
      const [found] = await db.select().from(users).where(eq(users.email, normalizedEmail));
      user = found;
    } else {
      user = localDb.findOne('users', u => u.email === normalizedEmail);
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = generateToken(user);
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        address: user.address,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// ─── Admin Login (Encryption Key + Hidden Username) ───
router.post('/admin', async (req, res) => {
  try {
    const { key, username } = req.body;

    if (!key || !username) {
      return res.status(400).json({ error: 'Master encryption key and username are required.' });
    }

    let adminCfg = null;
    let adminUser = null;

    if (isUsingNeon && db) {
      const [cfg] = await db.select().from(adminConfig);
      adminCfg = cfg;
    } else {
      adminCfg = localDb.findOne('admin_config', () => true);
    }

    if (!adminCfg) {
      return res.status(401).json({ error: 'Admin configuration not found. Please run seed script.' });
    }

    // 1. Verify encryption key
    const validKey = await bcrypt.compare(key, adminCfg.encryptedKey);
    if (!validKey) {
      return res.status(401).json({ error: 'Access denied. Invalid encryption credentials.' });
    }

    // 2. Verify hidden username
    const validUsername = await bcrypt.compare(username, adminCfg.usernameHash);
    if (!validUsername) {
      return res.status(401).json({ error: 'Access denied. Invalid encryption credentials.' });
    }

    // 3. Find admin user
    if (isUsingNeon && db) {
      const [foundUser] = await db.select().from(users).where(eq(users.role, 'admin'));
      if (!foundUser) {
        const [created] = await db.insert(users).values({
          email: 'admin@jpop.local',
          passwordHash: adminCfg.encryptedKey,
          name: 'J-Pop Admin',
          role: 'admin',
        }).returning();
        adminUser = created;
      } else {
        adminUser = foundUser;
      }
    } else {
      adminUser = localDb.findOne('users', u => u.role === 'admin') || {
        id: 1,
        email: 'admin@jpop.local',
        name: 'J-Pop Admin',
        role: 'admin',
      };
    }

    const token = generateToken(adminUser);
    res.json({
      token,
      user: {
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
        role: adminUser.role,
      },
    });
  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ error: 'Admin authentication failed.' });
  }
});

// ─── Get Current Authenticated User ───
router.get('/me', authenticate, async (req, res) => {
  try {
    let user = null;

    if (isUsingNeon && db) {
      const [found] = await db.select({
        id: users.id,
        email: users.email,
        name: users.name,
        phone: users.phone,
        address: users.address,
        role: users.role,
        createdAt: users.createdAt,
      }).from(users).where(eq(users.id, req.user.id));
      user = found;
    } else {
      const found = localDb.findOne('users', u => u.id === req.user.id);
      if (found) {
        user = {
          id: found.id,
          email: found.email,
          name: found.name,
          phone: found.phone,
          address: found.address,
          role: found.role,
          createdAt: found.createdAt,
        };
      }
    }

    if (!user) {
      return res.status(404).json({ error: 'User profile not found.' });
    }

    res.json({ user });
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ error: 'Failed to retrieve user profile.' });
  }
});

// ─── Update Profile (Customer) ───
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { name, phone, address } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name.trim();
    if (phone !== undefined) updates.phone = phone.trim();
    if (address !== undefined) updates.address = address.trim();

    if (isUsingNeon && db) {
      const [updated] = await db.update(users)
        .set(updates)
        .where(eq(users.id, req.user.id))
        .returning();

      return res.json({
        user: {
          id: updated.id,
          email: updated.email,
          name: updated.name,
          phone: updated.phone,
          address: updated.address,
          role: updated.role,
        },
      });
    } else {
      const updated = localDb.update('users', u => u.id === req.user.id, updates);
      return res.json({
        user: {
          id: updated.id,
          email: updated.email,
          name: updated.name,
          phone: updated.phone,
          address: updated.address,
          role: updated.role,
        },
      });
    }
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ error: 'Failed to update profile.' });
  }
});

// ─── Admin: List All Users ───
router.get('/users', authenticate, requireAdmin, async (req, res) => {
  try {
    let allUsers = [];

    if (isUsingNeon && db) {
      allUsers = await db.select({
        id: users.id,
        email: users.email,
        name: users.name,
        phone: users.phone,
        address: users.address,
        role: users.role,
        createdAt: users.createdAt,
      }).from(users).orderBy(desc(users.createdAt));
    } else {
      allUsers = localDb.find('users').map(u => ({
        id: u.id,
        email: u.email,
        name: u.name,
        phone: u.phone,
        address: u.address,
        role: u.role,
        createdAt: u.createdAt,
      }));
    }

    res.json({ users: allUsers });
  } catch (err) {
    console.error('List users error:', err);
    res.status(500).json({ error: 'Failed to fetch users list.' });
  }
});

// ─── Admin: Change User Role ───
router.patch('/users/:id/role', authenticate, requireAdmin, async (req, res) => {
  try {
    const { role } = req.body;
    const userId = parseInt(req.params.id);

    if (!['customer', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid user role.' });
    }

    if (isUsingNeon && db) {
      const [updated] = await db.update(users)
        .set({ role })
        .where(eq(users.id, userId))
        .returning();

      if (!updated) return res.status(404).json({ error: 'User not found.' });
      return res.json({ message: 'User role updated successfully.', user: updated });
    } else {
      const updated = localDb.update('users', u => u.id === userId, { role });
      if (!updated) return res.status(404).json({ error: 'User not found.' });
      return res.json({ message: 'User role updated successfully.', user: updated });
    }
  } catch (err) {
    console.error('Update user role error:', err);
    res.status(500).json({ error: 'Failed to update user role.' });
  }
});

// ─── Admin: Delete User ───
router.delete('/users/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    if (userId === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own admin account.' });
    }

    if (isUsingNeon && db) {
      const [deleted] = await db.delete(users)
        .where(eq(users.id, userId))
        .returning();

      if (!deleted) return res.status(404).json({ error: 'User not found.' });
      return res.json({ message: 'User removed successfully.' });
    } else {
      const deleted = localDb.delete('users', u => u.id === userId);
      if (!deleted) return res.status(404).json({ error: 'User not found.' });
      return res.json({ message: 'User removed successfully.' });
    }
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ error: 'Failed to delete user.' });
  }
});

export default router;
