import { Router, Request, Response } from 'express';
import db from '../db';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';
import { evaluateFairDispatch } from '../modules/dispatch/dispatchEngine';

const router = Router();

// GET /api/v1/bookings/services - Public catalog of services (Supports case-insensitive search & category filter)
router.get('/services', (req, res) => {
  const { query, category } = req.query;

  let sql = 'SELECT * FROM service_categories';
  const params: any[] = [];
  const conditions: string[] = [];

  if (query && typeof query === 'string' && query.trim() !== '') {
    const q = `%${query.trim().toLowerCase()}%`;
    conditions.push('(LOWER(title) LIKE ? OR LOWER(category) LIKE ? OR LOWER(description) LIKE ?)');
    params.push(q, q, q);
  }

  if (category && typeof category === 'string' && category.trim() !== '' && category.toLowerCase() !== 'all') {
    conditions.push('LOWER(category) = LOWER(?)');
    params.push(category.trim());
  }

  if (conditions.length > 0) {
    sql += ' WHERE ' + conditions.join(' AND ');
  }

  sql += ' ORDER BY title ASC';

  const services = db.prepare(sql).all(...params);
  return res.json({ services });
});

// GET /api/v1/bookings/:id/invoice - Digital Receipt / Invoice Generator
router.get('/:id/invoice', authenticateToken, (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const booking = db.prepare(`
    SELECT b.*, s.title as service_title, s.category as service_category,
           u_cust.name as customer_name, u_cust.email as customer_email, u_cust.phone as customer_phone,
           u_work.name as worker_name, u_work.phone as worker_phone, wp.profession as worker_profession
    FROM bookings b
    JOIN service_categories s ON b.service_id = s.id
    JOIN users u_cust ON b.customer_id = u_cust.id
    LEFT JOIN worker_profiles wp ON b.worker_id = wp.id
    LEFT JOIN users u_work ON wp.user_id = u_work.id
    WHERE b.id = ?
  `).get(id) as any;

  if (!booking) {
    return res.status(404).json({ error: 'Invoice not found for this booking.' });
  }

  const invoice = {
    invoiceNumber: `INV-${booking.booking_number}`,
    bookingNumber: booking.booking_number,
    date: booking.created_at,
    customer: {
      name: booking.customer_name,
      email: booking.customer_email,
      phone: booking.customer_phone,
      address: booking.address,
      locality: booking.locality,
    },
    worker: booking.worker_name ? {
      name: booking.worker_name,
      phone: booking.worker_phone,
      profession: booking.worker_profession,
    } : null,
    service: {
      title: booking.service_title,
      category: booking.service_category,
    },
    financialBreakdown: {
      subtotal: booking.total_amount,
      directWorkerEarnings: booking.worker_earnings,
      cooperativeFee: booking.coop_fee,
      welfareContribution: booking.welfare_fee,
      paymentStatus: booking.payment_status,
      currency: 'INR (₹)',
    },
    legalEntity: 'Coop Connect Digital Worker Cooperative Society Ltd. (Registered Bengaluru, India)',
  };

  return res.json({ invoice });
});

// POST /api/v1/bookings/create - Create booking and trigger FairDispatch
router.post('/create', authenticateToken, requireRole('CUSTOMER'), (req: AuthRequest, res: Response) => {
  const customerId = req.user!.id;
  const { serviceId, address, locality, lat, lng, scheduledTime, customWeights } = req.body;

  if (!serviceId || !address || !lat || !lng) {
    return res.status(400).json({ error: 'Service ID, address, latitude, and longitude are required.' });
  }

  const service = db.prepare('SELECT * FROM service_categories WHERE id = ?').get(serviceId) as any;
  if (!service) {
    return res.status(404).json({ error: 'Service not found.' });
  }

  const bookingId = `b-${Date.now()}`;
  const bookingNumber = `CC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  const totalAmount = service.base_price;
  const coopFee = Math.round(totalAmount * 0.10 * 100) / 100;
  const welfareFee = Math.round(totalAmount * 0.05 * 100) / 100;
  const workerEarnings = Math.round(totalAmount * 0.85 * 100) / 100;

  // 1. Evaluate FairDispatch engine
  const dispatchResult = evaluateFairDispatch(bookingId, lat, lng, service.category, customWeights);

  const assignedWorkerId = dispatchResult.selectedWorkerId;
  const initialStatus = assignedWorkerId ? 'DISPATCHED' : 'REQUESTED';

  // 2. Insert Booking record
  db.prepare(`
    INSERT INTO bookings (id, booking_number, customer_id, worker_id, service_id, status, address, locality, lat, lng, scheduled_time, total_amount, coop_fee, welfare_fee, worker_earnings, payment_status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    bookingId,
    bookingNumber,
    customerId,
    assignedWorkerId,
    serviceId,
    initialStatus,
    address,
    locality || 'Koramangala',
    lat,
    lng,
    scheduledTime || new Date().toISOString(),
    totalAmount,
    coopFee,
    welfareFee,
    workerEarnings,
    'HELD_IN_ESCROW'
  );

  // 3. If worker assigned, record Fairness Ledger transaction
  if (assignedWorkerId) {
    const worker = db.prepare('SELECT fairness_debt FROM worker_profiles WHERE id = ?').get(assignedWorkerId) as any;
    const oldDebt = worker ? worker.fairness_debt : 0;
    const newDebt = Math.max(0, Math.round((oldDebt - 5.0) * 10) / 10);

    db.prepare('UPDATE worker_profiles SET fairness_debt = ?, total_jobs_completed = total_jobs_completed + 1 WHERE id = ?')
      .run(newDebt, assignedWorkerId);

    db.prepare(`
      INSERT INTO fairness_ledger (id, worker_id, transaction_type, opportunity_delta, debt_before, debt_after, description)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      `fl-${Date.now()}`,
      assignedWorkerId,
      'JOB_ALLOCATED',
      -5.0,
      oldDebt,
      newDebt,
      `Allocated booking ${bookingNumber} (${service.title}) via FairDispatch Engine`
    );

    // Record automatic welfare fund contribution
    const welfareBalance = db.prepare('SELECT balance_after FROM welfare_fund_logs ORDER BY created_at DESC LIMIT 1').get() as any;
    const currentBalance = welfareBalance ? welfareBalance.balance_after : 100000;
    const newWelfareBalance = currentBalance + welfareFee;

    db.prepare(`
      INSERT INTO welfare_fund_logs (id, booking_id, worker_id, type, amount, balance_after, description)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      `wfl-${Date.now()}`,
      bookingId,
      assignedWorkerId,
      'AUTOMATIC_CONTRIBUTION',
      welfareFee,
      newWelfareBalance,
      `5% Welfare Fund Contribution from Booking ${bookingNumber}`
    );
  }

  // Fetch full details for response
  const bookingDetails = db.prepare(`
    SELECT b.*, s.title as service_title, s.category as service_category, u.name as worker_name, u.phone as worker_phone, u.avatar_url as worker_avatar
    FROM bookings b
    JOIN service_categories s ON b.service_id = s.id
    LEFT JOIN worker_profiles wp ON b.worker_id = wp.id
    LEFT JOIN users u ON wp.user_id = u.id
    WHERE b.id = ?
  `).get(bookingId) as any;

  return res.status(201).json({
    message: 'Booking created successfully',
    booking: bookingDetails,
    dispatchResult,
  });
});

// GET /api/v1/bookings/my-customer - Customer booking history
router.get('/my-customer', authenticateToken, requireRole('CUSTOMER'), (req: AuthRequest, res: Response) => {
  const customerId = req.user!.id;

  const bookings = db.prepare(`
    SELECT b.*, s.title as service_title, s.icon as service_icon, u.name as worker_name, u.phone as worker_phone, u.avatar_url as worker_avatar, wp.average_rating as worker_rating
    FROM bookings b
    JOIN service_categories s ON b.service_id = s.id
    LEFT JOIN worker_profiles wp ON b.worker_id = wp.id
    LEFT JOIN users u ON wp.user_id = u.id
    WHERE b.customer_id = ?
    ORDER BY b.created_at DESC
  `).all(customerId);

  return res.json({ bookings });
});

// POST & PATCH /api/v1/bookings/:id/status - Update booking status & payment status
const handleStatusUpdate = (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { status, paymentStatus, paymentMethod } = req.body;

  const validStatuses = ['ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'DISPATCHED', 'REQUESTED'];
  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid booking status.' });
  }

  const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(id) as any;
  if (!booking) {
    return res.status(404).json({ error: 'Booking not found.' });
  }

  let finalStatus = status || booking.status;
  let finalPaymentStatus = paymentStatus || booking.payment_status;

  if (finalStatus === 'COMPLETED') {
    finalPaymentStatus = 'RELEASED';
  } else if (paymentStatus === 'HELD_IN_ESCROW' || paymentStatus === 'PAID') {
    finalPaymentStatus = 'PAID';
  }

  db.prepare('UPDATE bookings SET status = ?, payment_status = ? WHERE id = ?')
    .run(finalStatus, finalPaymentStatus, id);

  return res.json({ message: `Booking status updated`, status: finalStatus, paymentStatus: finalPaymentStatus });
};

router.post('/:id/status', authenticateToken, handleStatusUpdate);
router.patch('/:id/status', authenticateToken, handleStatusUpdate);

// GET /api/v1/bookings/:id/invoice - Generate complete digital tax & welfare receipt
router.get('/:id/invoice', (req: Request, res: Response) => {
  const { id } = req.params;

  const booking = db.prepare(`
    SELECT b.*, 
           s.title as service_title, s.category as service_category,
           cu.name as customer_name, cu.email as customer_email, cu.phone as customer_phone,
           wu.name as worker_name, wu.phone as worker_phone, wp.profession as worker_profession
    FROM bookings b
    JOIN service_categories s ON b.service_id = s.id
    LEFT JOIN users cu ON b.customer_id = cu.id
    LEFT JOIN worker_profiles wp ON b.worker_id = wp.id
    LEFT JOIN users wu ON wp.user_id = wu.id
    WHERE b.id = ?
  `).get(id) as any;

  if (!booking) {
    return res.status(404).json({ error: 'Booking not found for invoice.' });
  }

  const total = booking.total_amount || 499;
  const baseAmount = Math.round((total / 1.18) * 100) / 100;
  const gstAmount = Math.round((total - baseAmount) * 100) / 100;

  const invoice = {
    cooperativeFederation: 'Coop Connect Informal Worker Cooperative Federation',
    invoiceNumber: `INV-${booking.booking_number || booking.id.toUpperCase()}`,
    invoiceDate: new Date(booking.created_at || Date.now()).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }),
    customer: {
      name: booking.customer_name || 'Customer Partner',
      phone: booking.customer_phone || '+91 98765 43210',
    },
    worker: {
      id: booking.worker_id || 'WP-101',
      name: booking.worker_name || 'FairDispatch Worker Partner',
      profession: booking.worker_profession || 'Verified Specialist',
    },
    serviceTitle: booking.service_title,
    serviceAddress: `${booking.address}, ${booking.locality}`,
    baseAmount,
    gstAmount,
    totalAmount: total,
    paymentStatus: booking.payment_status === 'RELEASED' ? 'Payment Completed' : 'Payment Secured',
    breakdown: {
      directWorkerPayout: Math.round(total * 0.85 * 100) / 100,
      platformReinvestment: Math.round(total * 0.10 * 100) / 100,
      welfareFundAllocation: Math.round(total * 0.05 * 100) / 100,
    }
  };

  return res.json({ invoice });
});

export default router;
