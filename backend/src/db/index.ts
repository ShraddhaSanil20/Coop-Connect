import Database from 'better-sqlite3';
import path from 'path';
import bcrypt from 'bcryptjs';

const dbPath = path.join(__dirname, '../../coop_connect.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase() {
  console.log('[DB] Initializing Coop Connect database schema...');

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('CUSTOMER', 'WORKER', 'COOP_ADMIN')),
      password_hash TEXT NOT NULL,
      avatar_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS worker_profiles (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      skills_json TEXT NOT NULL,
      profession TEXT NOT NULL DEFAULT 'Electrician',
      verification_status TEXT NOT NULL DEFAULT 'VERIFIED' CHECK(verification_status IN ('PENDING', 'VERIFIED', 'REJECTED')),
      safety_verified INTEGER NOT NULL DEFAULT 1,
      is_available INTEGER NOT NULL DEFAULT 1,
      locality TEXT NOT NULL DEFAULT 'Koramangala',
      current_lat REAL NOT NULL,
      current_lng REAL NOT NULL,
      service_radius_km REAL NOT NULL DEFAULT 15.0,
      experience_years INTEGER NOT NULL DEFAULT 3,
      total_jobs_completed INTEGER NOT NULL DEFAULT 0,
      average_rating REAL NOT NULL DEFAULT 5.0,
      fairness_debt REAL NOT NULL DEFAULT 0.0,
      opportunity_score REAL NOT NULL DEFAULT 50.0,
      performance_score REAL NOT NULL DEFAULT 90.0,
      wellbeing_index INTEGER NOT NULL DEFAULT 85,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS service_categories (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      base_price REAL NOT NULL,
      estimated_duration_mins INTEGER NOT NULL,
      icon TEXT NOT NULL,
      description TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      booking_number TEXT UNIQUE NOT NULL,
      customer_id TEXT NOT NULL REFERENCES users(id),
      worker_id TEXT REFERENCES worker_profiles(id),
      service_id TEXT NOT NULL REFERENCES service_categories(id),
      status TEXT NOT NULL CHECK(status IN ('REQUESTED', 'DISPATCHING', 'DISPATCHED', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
      address TEXT NOT NULL,
      locality TEXT NOT NULL DEFAULT 'Koramangala',
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      scheduled_time DATETIME NOT NULL,
      total_amount REAL NOT NULL,
      coop_fee REAL NOT NULL,
      welfare_fee REAL NOT NULL,
      worker_earnings REAL NOT NULL,
      payment_status TEXT NOT NULL DEFAULT 'HELD_IN_ESCROW' CHECK(payment_status IN ('PENDING_ESCROW', 'HELD_IN_ESCROW', 'RELEASED', 'REFUNDED')),
      rating INTEGER,
      review_text TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS dispatch_logs (
      id TEXT PRIMARY KEY,
      booking_id TEXT,
      selected_worker_id TEXT NOT NULL REFERENCES worker_profiles(id),
      hard_filtered_count INTEGER NOT NULL,
      candidate_breakdowns_json TEXT NOT NULL,
      weights_used_json TEXT NOT NULL,
      selected_rationale TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS fairness_ledger (
      id TEXT PRIMARY KEY,
      worker_id TEXT NOT NULL REFERENCES worker_profiles(id),
      transaction_type TEXT NOT NULL CHECK(transaction_type IN ('JOB_ALLOCATED', 'JOB_DECLINED', 'IDLE_REBALANCING', 'MANUAL_ADJUSTMENT')),
      opportunity_delta REAL NOT NULL,
      debt_before REAL NOT NULL,
      debt_after REAL NOT NULL,
      description TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS governance_proposals (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      proposer_id TEXT NOT NULL REFERENCES users(id),
      status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('DRAFT', 'ACTIVE', 'PASSED', 'REJECTED', 'EXPIRED')),
      quorum_required REAL NOT NULL DEFAULT 50.0,
      votes_for INTEGER NOT NULL DEFAULT 0,
      votes_against INTEGER NOT NULL DEFAULT 0,
      votes_abstain INTEGER NOT NULL DEFAULT 0,
      ends_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS governance_votes (
      id TEXT PRIMARY KEY,
      proposal_id TEXT NOT NULL REFERENCES governance_proposals(id),
      worker_id TEXT NOT NULL REFERENCES worker_profiles(id),
      choice TEXT NOT NULL CHECK(choice IN ('FOR', 'AGAINST', 'ABSTAIN')),
      cast_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(proposal_id, worker_id)
    );

    CREATE TABLE IF NOT EXISTS welfare_fund_logs (
      id TEXT PRIMARY KEY,
      booking_id TEXT,
      worker_id TEXT,
      type TEXT NOT NULL CHECK(type IN ('AUTOMATIC_CONTRIBUTION', 'HEALTH_INSURANCE_DISPLACEMENT', 'EMERGENCY_GRANT', 'SKILL_TRAINING_SUBSIDY')),
      amount REAL NOT NULL,
      balance_after REAL NOT NULL,
      description TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS safety_incidents (
      id TEXT PRIMARY KEY,
      reporter_id TEXT NOT NULL REFERENCES users(id),
      reporter_role TEXT NOT NULL,
      booking_id TEXT,
      assigned_worker_id TEXT REFERENCES worker_profiles(id),
      incident_type TEXT NOT NULL,
      description TEXT NOT NULL,
      severity TEXT NOT NULL CHECK(severity IN ('LOW', 'MEDIUM', 'HIGH', 'SOS')),
      status TEXT NOT NULL DEFAULT 'OPEN' CHECK(status IN ('OPEN', 'ACCEPTED', 'ON_THE_WAY', 'ARRIVED', 'RESOLVED', 'CANCELLED')),
      resolved_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS worker_leaves (
      id TEXT PRIMARY KEY,
      worker_id TEXT NOT NULL REFERENCES worker_profiles(id) ON DELETE CASCADE,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      reason TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'APPROVED', 'REJECTED')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  seedDemoData();
}

function seedDemoData() {
  // Clear existing tables for a clean seed update if schema changed
  try {
    const checkCol = db.prepare("PRAGMA table_info(worker_profiles)").all() as any[];
    const hasProfession = checkCol.some(c => c.name === 'profession');
    if (!hasProfession) {
      console.log('[DB] Upgrading schema: dropping old tables for clean seed...');
      db.exec(`
        DROP TABLE IF EXISTS dispatch_logs;
        DROP TABLE IF EXISTS bookings;
        DROP TABLE IF EXISTS governance_votes;
        DROP TABLE IF EXISTS governance_proposals;
        DROP TABLE IF EXISTS fairness_ledger;
        DROP TABLE IF EXISTS welfare_fund_logs;
        DROP TABLE IF EXISTS safety_incidents;
        DROP TABLE IF EXISTS worker_profiles;
        DROP TABLE IF EXISTS service_categories;
        DROP TABLE IF EXISTS users;
      `);
      initDatabase();
      return;
    }
  } catch (e) {
    console.error('[DB] Migration check error:', e);
  }

  const userCount = db.prepare('SELECT COUNT(*) as cnt FROM users').get() as { cnt: number };
  if (userCount.cnt > 0) {
    console.log('[DB] Demo data already seeded.');
    return;
  }

  console.log('[DB] Seeding realistic Coop Connect demo data across Bengaluru...');

  const passwordHash = bcrypt.hashSync('Password123!', 10);

  const insertUser = db.prepare(`
    INSERT INTO users (id, name, phone, email, role, password_hash, avatar_url)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  // Demo Accounts
  insertUser.run('u-customer-1', 'Ananya Roy', '+919812345678', 'customer@coopconnect.org', 'CUSTOMER', passwordHash, 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150');
  insertUser.run('u-coop-admin', 'Priya Nair (Operations Lead)', '+919899988877', 'admin@coopconnect.org', 'COOP_ADMIN', passwordHash, 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150');

  // Workers Across Bengaluru
  insertUser.run('u-worker-1', 'Sunita Sharma', '+919876543211', 'sunita.sharma@coopconnect.org', 'WORKER', passwordHash, 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150');
  insertUser.run('u-worker-2', 'Rajesh Kumar', '+919876543210', 'rajesh.kumar@coopconnect.org', 'WORKER', passwordHash, 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150');
  insertUser.run('u-worker-3', 'Amit Verma', '+919876543212', 'amit.verma@coopconnect.org', 'WORKER', passwordHash, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150');
  insertUser.run('u-worker-4', 'Priya Nair (Worker)', '+919876543214', 'priya.worker@coopconnect.org', 'WORKER', passwordHash, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150');
  insertUser.run('u-worker-5', 'Suresh Gowda', '+919876543215', 'suresh.gowda@coopconnect.org', 'WORKER', passwordHash, 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150');
  insertUser.run('u-worker-6', 'Kavitha Rao', '+919876543216', 'kavitha.rao@coopconnect.org', 'WORKER', passwordHash, 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150');
  insertUser.run('u-worker-7', 'Ramesh Babu', '+919876543217', 'ramesh.babu@coopconnect.org', 'WORKER', passwordHash, 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150');
  insertUser.run('u-worker-8', 'Imran Khan', '+919876543218', 'imran.khan@coopconnect.org', 'WORKER', passwordHash, 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150');
  insertUser.run('u-worker-9', 'Deepak Patel', '+919876543213', 'deepak.patel@coopconnect.org', 'WORKER', passwordHash, 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150');

  const insertWorker = db.prepare(`
    INSERT INTO worker_profiles (
      id, user_id, skills_json, profession, verification_status, safety_verified, is_available,
      locality, current_lat, current_lng, service_radius_km, experience_years, total_jobs_completed,
      average_rating, fairness_debt, opportunity_score, performance_score, wellbeing_index
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Worker 1: Sunita Sharma - Indiranagar (High Fairness Debt +34.5)
  insertWorker.run('w-sunita', 'u-worker-1', JSON.stringify(['Electrical Repair', 'Appliance Maintenance', 'Inverter Setup', 'AC Servicing']), 'Electrician', 'VERIFIED', 1, 1, 'Indiranagar', 12.9784, 77.6408, 15.0, 5, 4, 4.7, 34.5, 32.0, 91.0, 92);

  // Worker 2: Rajesh Kumar - Koramangala (Low Fairness Debt +1.2, High Volume 28 jobs)
  insertWorker.run('w-rajesh', 'u-worker-2', JSON.stringify(['Electrical Repair', 'Wiring Inspection', 'CCTV Setup']), 'Electrician', 'VERIFIED', 1, 1, 'Koramangala', 12.9352, 77.6245, 15.0, 7, 28, 4.9, 1.2, 88.0, 96.0, 78);

  // Worker 3: Amit Verma - HSR Layout
  insertWorker.run('w-amit', 'u-worker-3', JSON.stringify(['Plumbing Diagnostics', 'Sanitary Fitting', 'Tile Repair']), 'Plumber', 'VERIFIED', 1, 1, 'HSR Layout', 12.1025, 77.6412, 15.0, 4, 14, 4.8, 12.0, 60.0, 92.0, 61);

  // Worker 4: Priya Nair - Whitefield (Highest Fairness Debt +45.0)
  insertWorker.run('w-priya', 'u-worker-4', JSON.stringify(['Furniture Assembly', 'Custom Woodwork', 'Solar Panel Mounting']), 'Carpenter', 'VERIFIED', 1, 1, 'Whitefield', 12.9698, 77.7499, 20.0, 6, 2, 4.9, 45.0, 20.0, 95.0, 96);

  // Worker 5: Suresh Gowda - Hebbal
  insertWorker.run('w-suresh', 'u-worker-5', JSON.stringify(['Two Wheeler Repair', 'Engine Overhaul', 'Car Servicing']), 'Mechanic', 'VERIFIED', 1, 1, 'Hebbal', 13.0358, 77.5970, 18.0, 8, 19, 4.6, 22.0, 68.0, 89.0, 80);

  // Worker 6: Kavitha Rao - Jayanagar
  insertWorker.run('w-kavitha', 'u-worker-6', JSON.stringify(['Bridal Makeup', 'Hair Styling', 'South Indian Cooking']), 'Beautician', 'VERIFIED', 1, 1, 'Jayanagar', 12.9308, 77.5838, 12.0, 5, 8, 4.85, 18.5, 52.0, 94.0, 88);

  // Worker 7: Ramesh Babu - BTM Layout
  insertWorker.run('w-ramesh', 'u-worker-7', JSON.stringify(['Lawn Mowing', 'Organic Pest Spray', 'Terrace Gardening']), 'Gardener', 'VERIFIED', 1, 1, 'BTM Layout', 12.9166, 77.6101, 15.0, 10, 6, 4.75, 29.0, 42.0, 88.0, 84);

  // Worker 8: Imran Khan - Electronic City
  insertWorker.run('w-imran', 'u-worker-8', JSON.stringify(['Laptop Repair', 'WiFi Mesh Installation', 'PC Formatting']), 'Computer Technician', 'VERIFIED', 1, 1, 'Electronic City', 12.8399, 77.6770, 20.0, 3, 22, 4.9, 8.0, 80.0, 97.0, 75);

  // Worker 9: Deepak Patel - Marathahalli (Unverified for hard filter demo)
  insertWorker.run('w-deepak', 'u-worker-9', JSON.stringify(['Electrical Repair']), 'Electrician', 'PENDING', 0, 1, 'Marathahalli', 12.9592, 77.6974, 15.0, 1, 0, 4.5, 0.0, 20.0, 80.0, 95);

  // 20+ Service Categories
  const insertService = db.prepare(`
    INSERT INTO service_categories (id, title, category, base_price, estimated_duration_mins, icon, description)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertService.run('srv-1', 'Home Electrical Safety Audit & Repair', 'Electrician', 499.0, 60, 'Zap', 'Comprehensive safety inspection of switchboards, circuit breakers, and wiring fixes.');
  insertService.run('srv-2', 'Appliance & AC Maintenance', 'AC Technician', 799.0, 90, 'Cpu', 'Motor servicing, gas recharge, voltage check, and AC diagnostic.');
  insertService.run('srv-3', 'Plumbing Leak Repair & Pipe Fitting', 'Plumber', 399.0, 45, 'Droplet', 'High-pressure pipeline leak detection and faucet/valve replacement.');
  insertService.run('srv-4', 'Furniture Assembly & Woodwork', 'Carpenter', 599.0, 75, 'Hammer', 'Custom shelving, door alignment, hinge repair, and wooden furniture restoration.');
  insertService.run('srv-5', 'Deep Home Sanitization & Cleaning', 'Cleaner', 1299.0, 120, 'Sparkles', 'Eco-friendly deep cleaning with non-toxic cooperative-grade solutions.');
  insertService.run('srv-6', 'Wall Painting & Texture Work', 'Painter', 1499.0, 180, 'Paintbrush', 'Interior accent wall painting, moisture waterproofing, and drywall patch work.');
  insertService.run('srv-7', 'Two-Wheeler & Car Diagnostic Repair', 'Mechanic', 699.0, 60, 'Wrench', 'On-demand doorstep battery jumpstart, oil replacement, and brake tune-up.');
  insertService.run('srv-8', 'CCTV Security Camera Setup', 'CCTV Technician', 899.0, 90, 'Camera', 'HD IP camera installation, DVR configuration, and mobile remote view setup.');
  insertService.run('srv-9', 'Laptop & PC Hardware Diagnostic', 'Computer Technician', 599.0, 60, 'Monitor', 'OS reinstallation, RAM/SSD upgrade, malware cleanup, and screen replacement.');
  insertService.run('srv-10', 'Garden Care & Lawn Maintenance', 'Gardener', 449.0, 60, 'Flower2', 'Plant pruning, organic compost application, and lawn weed control.');
  insertService.run('srv-11', 'Eco-Friendly Herbal Pest Control', 'Pest Control', 999.0, 90, 'Bug', 'Odourless herbal treatment for termites, cockroaches, and bedbugs.');
  insertService.run('srv-12', 'At-Home Salon & Beautician Service', 'Beautician', 799.0, 75, 'Scissors', 'Professional facial, waxing, manicure, pedicure, and styling by certified artists.');
  insertService.run('srv-13', 'Grooming & Haircut Service', 'Barber', 349.0, 45, 'UserCheck', 'Hygienic doorstep haircut, beard grooming, and head massage.');
  insertService.run('srv-14', 'North/South Indian Home Cook', 'Cook', 699.0, 90, 'Utensils', 'Authentic home-style meal preparation for family gatherings or daily needs.');
  insertService.run('srv-15', 'Masonry & Concrete Patch Work', 'Mason', 899.0, 120, 'HardHat', 'Plastering repair, brickwork touchups, and compound wall fixing.');
  insertService.run('srv-16', 'Tile Fitting & Grouting Repair', 'Tile Worker', 749.0, 90, 'Grid', 'Bathroom tile replacement, anti-skid grouting, and marble polishing.');
  insertService.run('srv-17', 'Rooftop Solar Panel Maintenance', 'Solar Technician', 1199.0, 120, 'Sun', 'Solar inverter check, photovoltaic cell cleaning, and net-metering audit.');
  insertService.run('srv-18', 'Washing Machine & Refrigerator Repair', 'Appliance Technician', 549.0, 60, 'Tv', 'Drum motor repair, compressor diagnostic, and thermostat replacement.');
  insertService.run('srv-19', 'Home Nursing & Senior Assistance', 'Home Nurse', 1200.0, 240, 'HeartPulse', 'Certified vitals monitoring, post-operative care, and elderly assistance.');
  insertService.run('srv-20', 'Express Parcel & Heavy Goods Transport', 'Logistics', 399.0, 45, 'Truck', 'Worker-owned intra-city eco cargo delivery and heavy appliance movement.');

  // Initial Welfare Log
  const insertWelfare = db.prepare(`
    INSERT INTO welfare_fund_logs (id, booking_id, worker_id, type, amount, balance_after, description)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  insertWelfare.run('wfl-1', null, null, 'AUTOMATIC_CONTRIBUTION', 125000.0, 125000.0, 'Initial Cooperative Welfare Capital Pool');
  insertWelfare.run('wfl-2', null, 'w-sunita', 'HEALTH_INSURANCE_DISPLACEMENT', 3500.0, 121500.0, 'Annual Health Insurance Premium Subsidy for Sunita Sharma');

  // Governance Proposals
  const insertProposal = db.prepare(`
    INSERT INTO governance_proposals (id, title, description, category, proposer_id, status, quorum_required, votes_for, votes_against, votes_abstain, ends_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertProposal.run(
    'prop-1',
    'Increase Cooperative Welfare Contribution from 5% to 6% for Monsoon Health Coverage',
    'This proposal directs an additional 1% from platform revenue into the Worker Health & Safety Fund during peak monsoon disease season.',
    'Welfare Fund',
    'u-coop-admin',
    'ACTIVE',
    50.0,
    18,
    3,
    1,
    new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString()
  );

  insertProposal.run(
    'prop-2',
    'Procure Bulk Solar Tool Charging Kits for All Electricians & Techs',
    'Allocate ₹45,000 from cooperative reserve funds to purchase zero-emission solar battery charging packs for high-volume field workers.',
    'Equipment Subsidy',
    'u-worker-2',
    'ACTIVE',
    60.0,
    14,
    1,
    0,
    new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString()
  );

  console.log('[DB] Seeding completed successfully!');
}

export default db;
