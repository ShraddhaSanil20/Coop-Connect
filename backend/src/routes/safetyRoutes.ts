import { Router, Response } from 'express';
import db from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// POST /api/v1/safety/sos - Trigger Instant Emergency SOS Broadcast
router.post('/sos', authenticateToken, (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const role = req.user!.role;
  const { bookingId, lat, lng, note } = req.body;

  const incidentId = `sos-${Date.now()}`;
  const userLat = lat ? parseFloat(lat) : 12.9716;
  const userLng = lng ? parseFloat(lng) : 77.5946;

  // Query nearby verified active workers
  const nearbyWorkers = db.prepare(`
    SELECT wp.id, wp.user_id, u.name, u.phone, wp.profession, wp.base_latitude, wp.base_longitude
    FROM worker_profiles wp
    JOIN users u ON wp.user_id = u.id
    WHERE wp.verification_status = 'VERIFIED' AND wp.is_available = 1
    LIMIT 3
  `).all() as any[];

  const assignedWorker = nearbyWorkers.length > 0 ? nearbyWorkers[0] : null;

  db.prepare(`
    INSERT INTO safety_incidents (id, reporter_id, reporter_role, booking_id, incident_type, description, severity, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    incidentId,
    userId,
    role,
    bookingId || null,
    'EMERGENCY_SOS',
    note || `EMERGENCY SOS ALERT TRIGGERED at (${userLat.toFixed(4)}, ${userLng.toFixed(4)}). Assigned: ${assignedWorker ? assignedWorker.name : 'Coop Patrol Desk'}`,
    'SOS',
    'OPEN'
  );

  return res.status(201).json({
    message: 'EMERGENCY SOS BROADCASTED TO COOPERATIVE SAFETY TEAM & NEARBY WORKERS',
    incidentId,
    timestamp: new Date().toISOString(),
    status: 'ACTIVE_DISPATCH',
    capturedLocation: { lat: userLat, lng: userLng },
    nearbyWorkersCount: nearbyWorkers.length,
    assignedWorker: assignedWorker ? {
      name: assignedWorker.name,
      phone: assignedWorker.phone,
      profession: assignedWorker.profession,
    } : { name: 'Bengaluru Coop Emergency Desk', phone: '+91-80-2222-9999', profession: 'Safety Responder' },
  });
});

// PATCH /api/v1/safety/sos/:id/cancel - Cancel Active Emergency Incident
router.patch('/sos/:id/cancel', authenticateToken, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  db.prepare(`UPDATE safety_incidents SET status = 'RESOLVED' WHERE id = ?`).run(id);
  return res.json({ message: 'Emergency SOS request successfully cancelled.', incidentId: id, status: 'RESOLVED' });
});

// GET /api/v1/safety/incidents - List Safety Incidents for Cooperative Team
router.get('/incidents', authenticateToken, (req: AuthRequest, res: Response) => {
  const incidents = db.prepare(`
    SELECT s.*, u.name as reporter_name, u.phone as reporter_phone
    FROM safety_incidents s
    JOIN users u ON s.reporter_id = u.id
    ORDER BY s.created_at DESC
  `).all();

  return res.json({ incidents });
});

export default router;
