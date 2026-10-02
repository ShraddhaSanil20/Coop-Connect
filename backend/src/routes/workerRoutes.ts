import { Router, Response } from 'express';
import db from '../db';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';
import bcrypt from 'bcryptjs';

const router = Router();

// Profession to Suggested Skills Mapping
export const PROFESSION_SKILLS_MAP: Record<string, string[]> = {
  'Electrician': ['Electrical Repair', 'Appliance Maintenance', 'Wiring Inspection', 'Inverter Setup', 'DB Board Fixing'],
  'Plumber': ['Plumbing Diagnostics', 'Sanitary Fitting', 'Pipeline Leak Repair', 'Water Heater Installation'],
  'Carpenter': ['Furniture Assembly', 'Custom Woodwork', 'Door Alignment', 'Lock Repair', 'Modular Kitchen'],
  'Cleaner': ['Deep Home Sanitization', 'Sofa & Carpet Cleaning', 'Kitchen Degreasing', 'Bathroom Scrubbing'],
  'Painter': ['Wall Texture Painting', 'Waterproofing', 'Interior Touchup', 'Enamel Metal Paint'],
  'Mechanic': ['Two Wheeler Repair', 'Engine Overhaul', 'Car Servicing', 'Brake Tune-up', 'Battery Jumpstart'],
  'AC Technician': ['AC Servicing', 'Gas Charging', 'Compressor Repair', 'Duct Cleaning'],
  'CCTV Technician': ['CCTV Setup', 'IP Camera Configuration', 'DVR Hard Drive Repair', 'Remote View Setup'],
  'Computer Technician': ['Laptop Repair', 'SSD Upgrade', 'OS Formatting', 'WiFi Mesh Installation'],
  'Gardener': ['Lawn Mowing', 'Organic Pest Spray', 'Terrace Gardening', 'Plant Pruning'],
  'Pest Control': ['Herbal Termite Treatment', 'Bedbug Eradication', 'Cockroach Gel Treatment'],
  'Beautician': ['Bridal Makeup', 'Facial & Threading', 'Waxing & Pedicure', 'Hair Styling'],
  'Barber': ['Doorstep Haircut', 'Beard Styling', 'Head Massage', 'Hygienic Trimming'],
  'Cook': ['South Indian Meal', 'North Indian Thali', 'Dietary Meal Prep', 'Party Catering'],
  'Mason': ['Concrete Patching', 'Plaster Repair', 'Brickwork Construction', 'Compound Wall Fix'],
  'Tile Worker': ['Tile Fitting', 'Anti-Skid Grouting', 'Marble Polishing', 'Granite Fitting'],
  'Solar Technician': ['Solar Panel Mounting', 'Inverter Net-Metering', 'Solar Cell Cleaning', 'Battery Maintenance'],
  'Appliance Technician': ['Washing Machine Motor Repair', 'Refrigerator Servicing', 'Microwave Repair'],
  'Home Nurse': ['Vitals Monitoring', 'Elderly Mobility Care', 'Post-Op Bandaging', 'Drip Administration'],
  'Logistics': ['Intra-City Cargo Transport', 'Heavy Furniture Moving', 'Appliance Courier'],
};

// GET /api/v1/workers/professions - Get supported professions and skill suggestions
router.get('/professions', (req, res) => {
  return res.json({ professionSkillsMap: PROFESSION_SKILLS_MAP });
});

// GET /api/v1/workers - Public/Authenticated listing of all workers
router.get('/', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const workers = db.prepare(`
    SELECT 
      w.*, u.name, u.phone, u.email, u.avatar_url
    FROM worker_profiles w
    JOIN users u ON w.user_id = u.id
    WHERE w.id NOT IN (
      SELECT worker_id FROM worker_leaves 
      WHERE status = 'APPROVED' AND ? BETWEEN start_date AND end_date
    )
    ORDER BY w.fairness_debt DESC
  `).all(today) as any[];

  const formatted = workers.map(w => ({
    id: w.id,
    userId: w.user_id,
    name: w.name,
    phone: w.phone,
    email: w.email,
    avatarUrl: w.avatar_url,
    profession: w.profession || 'Electrician',
    locality: w.locality || 'Koramangala',
    skills: JSON.parse(w.skills_json || '[]'),
    verificationStatus: w.verification_status,
    safetyVerified: Boolean(w.safety_verified),
    isAvailable: Boolean(w.is_available),
    lat: w.current_lat,
    lng: w.current_lng,
    base_latitude: w.current_lat,
    base_longitude: w.current_lng,
    serviceRadiusKm: w.service_radius_km,
    service_radius_km: w.service_radius_km,
    experienceYears: w.experience_years,
    totalJobsCompleted: w.total_jobs_completed,
    averageRating: w.total_jobs_completed === 0 ? 0 : w.average_rating,
    average_rating: w.total_jobs_completed === 0 ? 0 : w.average_rating,
    fairnessDebt: w.fairness_debt,
    fairness_debt: w.fairness_debt,
    opportunityScore: w.opportunity_score,
    performanceScore: w.performance_score,
    wellbeingIndex: w.wellbeing_index,
    is_available: w.is_available,
  }));

  return res.json({ workers: formatted });
});

// GET /api/v1/workers/all - Public/Authenticated listing of workers for cooperative view / map
router.get('/all', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const workers = db.prepare(`
    SELECT 
      w.*, u.name, u.phone, u.email, u.avatar_url
    FROM worker_profiles w
    JOIN users u ON w.user_id = u.id
    WHERE w.id NOT IN (
      SELECT worker_id FROM worker_leaves 
      WHERE status = 'APPROVED' AND ? BETWEEN start_date AND end_date
    )
    ORDER BY w.fairness_debt DESC
  `).all(today) as any[];

  const formatted = workers.map(w => ({
    id: w.id,
    userId: w.user_id,
    name: w.name,
    phone: w.phone,
    email: w.email,
    avatarUrl: w.avatar_url,
    profession: w.profession || 'Electrician',
    locality: w.locality || 'Koramangala',
    skills: JSON.parse(w.skills_json || '[]'),
    verificationStatus: w.verification_status,
    safetyVerified: Boolean(w.safety_verified),
    isAvailable: Boolean(w.is_available),
    lat: w.current_lat,
    lng: w.current_lng,
    base_latitude: w.current_lat,
    base_longitude: w.current_lng,
    serviceRadiusKm: w.service_radius_km,
    service_radius_km: w.service_radius_km,
    experienceYears: w.experience_years,
    totalJobsCompleted: w.total_jobs_completed,
    averageRating: w.total_jobs_completed === 0 ? 0 : w.average_rating,
    average_rating: w.total_jobs_completed === 0 ? 0 : w.average_rating,
    fairnessDebt: w.fairness_debt,
    fairness_debt: w.fairness_debt,
    opportunityScore: w.opportunity_score,
    performanceScore: w.performance_score,
    wellbeingIndex: w.wellbeing_index,
    is_available: w.is_available,
  }));

  return res.json({ workers: formatted });
});

// GET /api/v1/workers/my-dashboard - Worker personal dashboard data
router.get('/my-dashboard', authenticateToken, requireRole('WORKER'), (req: AuthRequest, res: Response) => {
  const workerProfileId = req.user!.workerProfileId;
  if (!workerProfileId) {
    return res.status(404).json({ error: 'Worker profile not found.' });
  }

  const profile = db.prepare(`
    SELECT w.*, u.name, u.email, u.phone, u.avatar_url
    FROM worker_profiles w
    JOIN users u ON w.user_id = u.id
    WHERE w.id = ?
  `).get(workerProfileId) as any;

  if (!profile) {
    return res.status(404).json({ error: 'Worker profile not found.' });
  }

  const activeBookings = db.prepare(`
    SELECT b.*, s.title as service_title, u.name as customer_name, u.phone as customer_phone
    FROM bookings b
    JOIN service_categories s ON b.service_id = s.id
    JOIN users u ON b.customer_id = u.id
    WHERE b.worker_id = ? AND b.status IN ('DISPATCHED', 'ACCEPTED', 'IN_PROGRESS')
    ORDER BY b.created_at DESC
  `).all(workerProfileId) as any[];

  const completedJobs = db.prepare(`
    SELECT b.*, s.title as service_title
    FROM bookings b
    JOIN service_categories s ON b.service_id = s.id
    WHERE b.worker_id = ? AND b.status = 'COMPLETED'
    ORDER BY b.created_at DESC
    LIMIT 10
  `).all(workerProfileId) as any[];

  const earningsSum = db.prepare(`
    SELECT SUM(worker_earnings) as total
    FROM bookings
    WHERE worker_id = ? AND status = 'COMPLETED'
  `).get(workerProfileId) as { total: number | null };

  const fairnessLogs = db.prepare(`
    SELECT * FROM fairness_ledger
    WHERE worker_id = ?
    ORDER BY created_at DESC
    LIMIT 10
  `).all(workerProfileId);

  return res.json({
    profile: {
      id: profile.id,
      name: profile.name,
      email: profile.email,
      phone: profile.phone,
      avatarUrl: profile.avatar_url,
      profession: profile.profession || 'Electrician',
      locality: profile.locality || 'Koramangala',
      skills: JSON.parse(profile.skills_json || '[]'),
      verificationStatus: profile.verification_status,
      safetyVerified: Boolean(profile.safety_verified),
      isAvailable: Boolean(profile.is_available),
      totalJobsCompleted: profile.total_jobs_completed,
      averageRating: profile.average_rating,
      fairnessDebt: profile.fairness_debt,
      opportunityScore: profile.opportunity_score,
      performanceScore: profile.performance_score,
      wellbeingIndex: profile.wellbeing_index,
    },
    activeBookings: activeBookings.map(b => ({
      id: b.id,
      bookingNumber: b.booking_number,
      serviceTitle: b.service_title,
      customerName: b.customer_name,
      customerPhone: b.customer_phone,
      address: b.address,
      lat: b.lat,
      lng: b.lng,
      status: b.status,
      totalAmount: b.total_amount,
      workerEarnings: b.worker_earnings,
      scheduledTime: b.scheduled_time,
    })),
    recentCompletedJobs: completedJobs,
    totalEarnings: earningsSum.total || 0,
    fairnessLogs,
  });
});

// POST /api/v1/workers/toggle-availability
router.post('/toggle-availability', authenticateToken, requireRole('WORKER'), (req: AuthRequest, res: Response) => {
  const workerProfileId = req.user!.workerProfileId;
  const { isAvailable } = req.body;

  db.prepare(`
    UPDATE worker_profiles
    SET is_available = ?
    WHERE id = ?
  `).run(isAvailable ? 1 : 0, workerProfileId);

  return res.json({ message: 'Availability status updated', isAvailable: Boolean(isAvailable) });
});

// PUT /api/v1/workers/skills - Update skills list for authenticated worker
router.put('/skills', authenticateToken, requireRole('WORKER'), (req: AuthRequest, res: Response) => {
  const workerProfileId = req.user!.workerProfileId;
  const { skills } = req.body;

  if (!Array.isArray(skills)) {
    return res.status(400).json({ error: 'Skills must be an array of strings.' });
  }

  db.prepare(`
    UPDATE worker_profiles
    SET skills_json = ?
    WHERE id = ?
  `).run(JSON.stringify(skills), workerProfileId);

  return res.json({ message: 'Worker skills updated successfully', skills });
});

// POST /api/v1/workers - Admin route to Add Worker
router.post('/', (req: AuthRequest, res: Response) => {
  const {
    name,
    phone,
    email,
    profession,
    skills,
    locality,
    baseLatitude,
    baseLongitude,
    serviceRadiusKm,
    lat,
    lng,
    experienceYears,
    rating,
    verificationStatus,
    isAvailable
  } = req.body;

  if (!name || !phone || !email || !profession) {
    return res.status(400).json({ error: 'Name, phone, email, and profession are required.' });
  }

  const userId = `u-worker-${Date.now()}`;
  const workerId = `w-worker-${Date.now()}`;
  const passwordHash = bcrypt.hashSync('Password123!', 10);
  const avatarUrl = `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150`;

  try {
    db.prepare(`
      INSERT INTO users (id, name, phone, email, role, password_hash, avatar_url)
      VALUES (?, ?, ?, ?, 'WORKER', ?, ?)
    `).run(userId, name, phone, email, passwordHash, avatarUrl);

    db.prepare(`
      INSERT INTO worker_profiles (
        id, user_id, skills_json, profession, verification_status, safety_verified, is_available,
        locality, current_lat, current_lng, service_radius_km, experience_years, total_jobs_completed,
        average_rating, fairness_debt, opportunity_score, performance_score, wellbeing_index
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, 25.0, 50.0, 90.0, 90)
    `).run(
      workerId,
      userId,
      JSON.stringify(skills || [profession]),
      profession,
      verificationStatus || 'VERIFIED',
      verificationStatus === 'VERIFIED' ? 1 : 0,
      isAvailable !== false ? 1 : 0,
      locality || 'Koramangala',
      baseLatitude || lat || 12.9352,
      baseLongitude || lng || 77.6245,
      serviceRadiusKm || 15.0,
      experienceYears || 3,
      rating || 4.8
    );

    return res.status(201).json({
      message: 'New worker created successfully',
      worker: {
        id: workerId,
        userId,
        name,
        phone,
        email,
        profession,
        locality: locality || 'Koramangala',
        skills: skills || [profession],
        verificationStatus: verificationStatus || 'VERIFIED',
        isAvailable: isAvailable !== false,
        lat: baseLatitude || lat || 12.9352,
        lng: baseLongitude || lng || 77.6245,
        rating: rating || 4.8,
      }
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to create worker.' });
  }
});

// PUT /api/v1/workers/:id - Admin route to Edit Worker Details
router.put('/:id', (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const {
    name,
    phone,
    profession,
    skills,
    locality,
    baseLatitude,
    baseLongitude,
    serviceRadiusKm,
    lat,
    lng,
    verificationStatus,
    isAvailable,
    rating
  } = req.body;

  const profile = db.prepare(`SELECT * FROM worker_profiles WHERE id = ?`).get(id) as any;
  if (!profile) {
    return res.status(404).json({ error: 'Worker not found.' });
  }

  if (name || phone) {
    db.prepare(`
      UPDATE users
      SET name = COALESCE(?, name), phone = COALESCE(?, phone)
      WHERE id = ?
    `).run(name || null, phone || null, profile.user_id);
  }

  db.prepare(`
    UPDATE worker_profiles
    SET 
      profession = COALESCE(?, profession),
      skills_json = COALESCE(?, skills_json),
      locality = COALESCE(?, locality),
      current_lat = COALESCE(?, current_lat),
      current_lng = COALESCE(?, current_lng),
      service_radius_km = COALESCE(?, service_radius_km),
      verification_status = COALESCE(?, verification_status),
      safety_verified = CASE WHEN ? = 'VERIFIED' THEN 1 ELSE safety_verified END,
      is_available = COALESCE(?, is_available),
      average_rating = COALESCE(?, average_rating)
    WHERE id = ?
  `).run(
    profession || null,
    skills ? JSON.stringify(skills) : null,
    locality || null,
    baseLatitude || lat || null,
    baseLongitude || lng || null,
    serviceRadiusKm || null,
    verificationStatus || null,
    verificationStatus || null,
    isAvailable !== undefined ? (isAvailable ? 1 : 0) : null,
    rating || null,
    id
  );

  return res.json({ message: 'Worker profile updated successfully.' });
});

// PUT /api/v1/workers/:id/verify - Approve or Reject worker verification
router.put('/:id/verify', (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body; // 'VERIFIED' | 'REJECTED' | 'PENDING'

  if (!status || !['VERIFIED', 'REJECTED', 'PENDING'].includes(status)) {
    return res.status(400).json({ error: 'Valid status (VERIFIED, REJECTED, PENDING) is required.' });
  }

  const safetyVerified = status === 'VERIFIED' ? 1 : 0;
  const result = db.prepare(`
    UPDATE worker_profiles
    SET verification_status = ?, safety_verified = ?
    WHERE id = ?
  `).run(status, safetyVerified, id);

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Worker profile not found.' });
  }

  return res.json({ message: `Worker verification status updated to ${status}`, status });
});

export default router;
