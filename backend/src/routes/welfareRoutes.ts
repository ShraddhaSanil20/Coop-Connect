import { Router, Response } from 'express';
import db from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/v1/welfare/vault - Welfare Fund Balance & Transaction History
router.get('/vault', authenticateToken, (req: AuthRequest, res: Response) => {
  const latestLog = db.prepare('SELECT balance_after FROM welfare_fund_logs ORDER BY created_at DESC LIMIT 1').get() as any;
  const currentBalance = latestLog ? latestLog.balance_after : 121500;

  const logs = db.prepare(`
    SELECT w.*, u.name as worker_name
    FROM welfare_fund_logs w
    LEFT JOIN worker_profiles wp ON w.worker_id = wp.id
    LEFT JOIN users u ON wp.user_id = u.id
    ORDER BY w.created_at DESC
    LIMIT 20
  `).all();

  return res.json({
    balance: currentBalance,
    transactions: logs,
    supportedPrograms: [
      { id: 'p1', title: 'Monsoon Health & Outpatient Coverage', coverage: 'Up to ₹15,000 / year', category: 'Health' },
      { id: 'p2', title: 'Solar Tool & Battery Pack Subsidy', coverage: '50% direct subsidy', category: 'Equipment' },
      { id: 'p3', title: 'Emergency Income Protection Grant', coverage: '₹5,000 one-time grant', category: 'Emergency' },
    ],
  });
});

// POST /api/v1/welfare/apply - Apply for emergency welfare grant
router.post('/apply', authenticateToken, (req: AuthRequest, res: Response) => {
  const { programTitle, amount, reason } = req.body;

  const workerProfileId = req.user?.workerProfileId || 'w-rajesh';

  const latestLog = db.prepare('SELECT balance_after FROM welfare_fund_logs ORDER BY created_at DESC LIMIT 1').get() as any;
  const currentBalance = latestLog ? latestLog.balance_after : 121500;

  const claimAmount = Number(amount) || 2500;
  const newBalance = Math.max(0, currentBalance - claimAmount);

  db.prepare(`
    INSERT INTO welfare_fund_logs (id, booking_id, worker_id, type, amount, balance_after, description)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    `wfl-${Date.now()}`,
    null,
    workerProfileId,
    'EMERGENCY_GRANT',
    claimAmount,
    newBalance,
    `Disbursed grant for ${programTitle || 'Emergency Assistance'}: ${reason || 'Medical / Income support'}`
  );

  return res.json({ message: 'Welfare claim approved and disbursed successfully', newBalance });
});

export default router;
