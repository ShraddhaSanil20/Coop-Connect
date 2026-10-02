import { Router, Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import db from '../db';

const router = Router();

// Worker: Submit Leave Application
router.post('/', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const worker = db.prepare('SELECT id FROM worker_profiles WHERE user_id = ?').get(userId) as { id: string } | undefined;
    if (!worker) {
      return res.status(403).json({ success: false, error: 'Only registered workers can submit leave applications.' });
    }

    const { start_date, end_date, reason } = req.body;
    if (!start_date || !end_date || !reason) {
      return res.status(400).json({ success: false, error: 'Please provide start_date, end_date, and reason.' });
    }

    const leaveId = 'lvl-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);

    db.prepare(`
      INSERT INTO worker_leaves (id, worker_id, start_date, end_date, reason, status)
      VALUES (?, ?, ?, ?, ?, 'PENDING')
    `).run(leaveId, worker.id, start_date, end_date, reason);

    const leave = db.prepare(`
      SELECT l.*, u.name as worker_name, w.profession
      FROM worker_leaves l
      JOIN worker_profiles w ON l.worker_id = w.id
      JOIN users u ON w.user_id = u.id
      WHERE l.id = ?
    `).get(leaveId);

    return res.status(201).json({ success: true, data: leave });
  } catch (error: any) {
    console.error('[Leave] Create error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Worker: View My Leaves
router.get('/mine', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const worker = db.prepare('SELECT id FROM worker_profiles WHERE user_id = ?').get(userId) as { id: string } | undefined;
    if (!worker) {
      return res.json({ success: true, data: [] });
    }

    const leaves = db.prepare(`
      SELECT l.*, u.name as worker_name, w.profession
      FROM worker_leaves l
      JOIN worker_profiles w ON l.worker_id = w.id
      JOIN users u ON w.user_id = u.id
      WHERE l.worker_id = ?
      ORDER BY l.created_at DESC
    `).all(worker.id);

    return res.json({ success: true, data: leaves });
  } catch (error: any) {
    console.error('[Leave] Fetch mine error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Admin / Cooperative View: Get All Leaves
router.get('/', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const leaves = db.prepare(`
      SELECT l.*, u.name as worker_name, w.profession, w.locality
      FROM worker_leaves l
      JOIN worker_profiles w ON l.worker_id = w.id
      JOIN users u ON w.user_id = u.id
      ORDER BY l.created_at DESC
    `).all();

    return res.json({ success: true, data: leaves });
  } catch (error: any) {
    console.error('[Leave] Fetch all error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Admin: Approve or Reject Leave Request
router.patch('/:id/status', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['APPROVED', 'REJECTED', 'PENDING'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status. Must be APPROVED, REJECTED, or PENDING.' });
    }

    db.prepare('UPDATE worker_leaves SET status = ? WHERE id = ?').run(status, id);

    const leave = db.prepare('SELECT * FROM worker_leaves WHERE id = ?').get(id) as any;
    if (leave && status === 'APPROVED') {
      const today = new Date().toISOString().split('T')[0];
      if (today >= leave.start_date && today <= leave.end_date) {
        // Automatically mark worker unavailable while on approved leave
        db.prepare('UPDATE worker_profiles SET is_available = 0 WHERE id = ?').run(leave.worker_id);
      }
    } else if (leave && status === 'REJECTED') {
      db.prepare('UPDATE worker_profiles SET is_available = 1 WHERE id = ?').run(leave.worker_id);
    }

    const updatedLeave = db.prepare(`
      SELECT l.*, u.name as worker_name, w.profession, w.locality
      FROM worker_leaves l
      JOIN worker_profiles w ON l.worker_id = w.id
      JOIN users u ON w.user_id = u.id
      WHERE l.id = ?
    `).get(id);

    return res.json({ success: true, data: updatedLeave });
  } catch (error: any) {
    console.error('[Leave] Update status error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
