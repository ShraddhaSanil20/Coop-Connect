import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import db from '../db';

export const JWT_SECRET = process.env.JWT_SECRET || 'coop-connect-super-secret-jwt-key-2026';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    name: string;
    email: string;
    phone: string;
    role: 'CUSTOMER' | 'WORKER' | 'COOP_ADMIN';
    workerProfileId?: string;
  };
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  let token = req.cookies?.token;

  if (!token && req.headers.authorization) {
    const authHeader = req.headers.authorization;
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  if (!token) {
    return res.status(401).json({ error: 'Authentication required. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // Fetch fresh user info from DB to ensure active status
    const user = db.prepare('SELECT id, name, email, phone, role FROM users WHERE id = ?').get(decoded.id) as any;
    if (!user) {
      return res.status(401).json({ error: 'User account no longer exists.' });
    }

    let workerProfileId: string | undefined;
    if (user.role === 'WORKER') {
      const wp = db.prepare('SELECT id FROM worker_profiles WHERE user_id = ?').get(user.id) as any;
      if (wp) workerProfileId = wp.id;
    }

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      workerProfileId,
    };

    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired authentication token.' });
  }
}

export function requireRole(...roles: ('CUSTOMER' | 'WORKER' | 'COOP_ADMIN')[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: `Forbidden. Role '${req.user.role}' is not authorized for this resource.` });
    }
    next();
  };
}
