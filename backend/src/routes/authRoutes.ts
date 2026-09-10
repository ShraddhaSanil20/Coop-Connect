import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db';
import { JWT_SECRET, authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// POST /api/v1/auth/login
router.post('/login', (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password credentials.' });
  }

  const isMatch = bcrypt.compareSync(password, user.password_hash);
  if (!isMatch) {
    return res.status(401).json({ error: 'Invalid email or password credentials.' });
  }

  let workerProfile = null;
  if (user.role === 'WORKER') {
    workerProfile = db.prepare('SELECT * FROM worker_profiles WHERE user_id = ?').get(user.id);
  }

  const token = jwt.sign(
    { id: user.id, role: user.role, email: user.email },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000,
  });

  return res.json({
    message: 'Authentication successful',
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      avatarUrl: user.avatar_url,
      workerProfile: workerProfile ? {
        id: (workerProfile as any).id,
        skills: JSON.parse((workerProfile as any).skills_json || '[]'),
        verificationStatus: (workerProfile as any).verification_status,
        safetyVerified: Boolean((workerProfile as any).safety_verified),
        isAvailable: Boolean((workerProfile as any).is_available),
        totalJobsCompleted: (workerProfile as any).total_jobs_completed,
        averageRating: (workerProfile as any).average_rating,
        fairnessDebt: (workerProfile as any).fairness_debt,
        wellbeingIndex: (workerProfile as any).wellbeing_index,
      } : null,
    },
  });
});

// GET /api/v1/auth/me
router.get('/me', authenticateToken, (req: AuthRequest, res: Response) => {
  const user = db.prepare('SELECT id, name, email, phone, role, avatar_url FROM users WHERE id = ?').get(req.user!.id) as any;
  
  let workerProfile = null;
  if (user.role === 'WORKER') {
    workerProfile = db.prepare('SELECT * FROM worker_profiles WHERE user_id = ?').get(user.id);
  }

  return res.json({
    user: {
      ...user,
      workerProfile: workerProfile ? {
        id: (workerProfile as any).id,
        skills: JSON.parse((workerProfile as any).skills_json || '[]'),
        verificationStatus: (workerProfile as any).verification_status,
        safetyVerified: Boolean((workerProfile as any).safety_verified),
        isAvailable: Boolean((workerProfile as any).is_available),
        totalJobsCompleted: (workerProfile as any).total_jobs_completed,
        averageRating: (workerProfile as any).average_rating,
        fairnessDebt: (workerProfile as any).fairness_debt,
        opportunityScore: (workerProfile as any).opportunity_score,
        performanceScore: (workerProfile as any).performance_score,
        wellbeingIndex: (workerProfile as any).wellbeing_index,
      } : null,
    },
  });
});

// POST /api/v1/auth/register
router.post('/register', (req: Request, res: Response) => {
  const { name, email, phone, password, role, profession, skills, experience_years, locality, certificateUrl } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required.' });
  }

  const existingEmail = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existingEmail) {
    return res.status(400).json({ error: 'An account with this email address already exists.' });
  }

  if (phone && phone.trim() !== '') {
    const existingPhone = db.prepare('SELECT id FROM users WHERE phone = ?').get(phone.trim());
    if (existingPhone) {
      return res.status(400).json({ error: 'This phone number is already registered.' });
    }
  }

  const userId = `u-${Date.now()}`;
  const passwordHash = bcrypt.hashSync(password, 10);
  const userRole = role === 'WORKER' ? 'WORKER' : (role === 'COOP_ADMIN' ? 'COOP_ADMIN' : 'CUSTOMER');
  const userPhone = phone ? phone.trim() : `+91 98${Math.floor(10000000 + Math.random() * 90000000)}`;

  db.prepare(`
    INSERT INTO users (id, name, email, phone, role, password_hash, created_at)
    VALUES (?, ?, ?, ?, ?, ?, DATETIME('now'))
  `).run(userId, name, email, userPhone, userRole, passwordHash);

  let workerProfileObj = null;
  if (userRole === 'WORKER') {
    const workerProfileId = `w-${Date.now()}`;
    const prof = profession || 'Electrician';
    const sk = skills ? skills.split(',').map((s: string) => s.trim()) : [prof];
    const exp = Number(experience_years) || 3;
    const loc = locality || 'Indiranagar, Bengaluru';

    db.prepare(`
      INSERT INTO worker_profiles (
        id, user_id, profession, skills_json, experience_years, base_locality,
        verification_status, safety_verified, is_available, certificate_url,
        total_jobs_completed, average_rating, fairness_debt, opportunity_score,
        performance_score, wellbeing_index, lat, lng, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'PENDING', 0, 1, ?, 0, 5.0, 0, 1.0, 1.0, 1.0, 12.9716, 77.5946, DATETIME('now'))
    `).run(workerProfileId, userId, prof, JSON.stringify(sk), exp, loc, certificateUrl || null);

    workerProfileObj = {
      id: workerProfileId,
      skills: sk,
      verificationStatus: 'PENDING',
      safetyVerified: false,
      isAvailable: true,
      totalJobsCompleted: 0,
      averageRating: 5.0,
      fairnessDebt: 0,
      wellbeingIndex: 1.0,
    };
  }

  const token = jwt.sign(
    { id: userId, role: userRole, email, workerProfileId: workerProfileObj?.id },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000,
  });

  return res.status(201).json({
    message: 'User registered successfully',
    token,
    user: {
      id: userId,
      name,
      email,
      phone: userPhone,
      role: userRole,
      avatarUrl: null,
      workerProfile: workerProfileObj,
    },
  });
});

// POST /api/v1/auth/logout
router.post('/logout', (req: Request, res: Response) => {
  res.clearCookie('token');
  return res.json({ message: 'Logged out successfully' });
});

export default router;
