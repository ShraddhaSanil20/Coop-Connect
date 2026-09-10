import { Router, Response } from 'express';
import db from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/v1/governance/proposals
router.get('/proposals', authenticateToken, (req: AuthRequest, res: Response) => {
  const proposals = db.prepare(`
    SELECT g.*, u.name as proposer_name
    FROM governance_proposals g
    JOIN users u ON g.proposer_id = u.id
    ORDER BY g.created_at DESC
  `).all() as any[];

  let userVoteMap: Record<string, string> = {};
  const voterId = req.user?.workerProfileId || req.user?.id;
  if (voterId) {
    const votes = db.prepare('SELECT proposal_id, choice FROM governance_votes WHERE worker_id = ?').all(voterId) as any[];
    votes.forEach(v => {
      userVoteMap[v.proposal_id] = v.choice;
    });
  }

  const formatted = proposals.map(p => ({
    id: p.id,
    title: p.title,
    description: p.description,
    category: p.category,
    proposerName: p.proposer_name,
    status: p.status,
    quorumRequired: p.quorum_required,
    votesFor: p.votes_for,
    votesAgainst: p.votes_against,
    votesAbstain: p.votes_abstain,
    totalVotes: p.votes_for + p.votes_against + p.votes_abstain,
    endsAt: p.ends_at,
    userVote: userVoteMap[p.id] || null,
  }));

  return res.json({ proposals: formatted });
});

// POST /api/v1/governance/proposals/:id/vote - Cast Democratic One-Worker-One-Vote Ballot
router.post('/proposals/:id/vote', authenticateToken, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { choice } = req.body; // 'FOR', 'AGAINST', 'ABSTAIN'

  if (!['FOR', 'AGAINST', 'ABSTAIN'].includes(choice)) {
    return res.status(400).json({ error: 'Invalid vote choice.' });
  }

  const voterId = req.user?.workerProfileId || req.user?.id;
  if (!voterId) {
    return res.status(403).json({ error: 'Please log in to cast your democratic ballot.' });
  }

  const proposal = db.prepare('SELECT * FROM governance_proposals WHERE id = ?').get(id) as any;
  if (!proposal) {
    return res.status(404).json({ error: 'Proposal not found.' });
  }

  if (proposal.status !== 'ACTIVE') {
    return res.status(400).json({ error: 'Voting is closed for this proposal.' });
  }

  // Check if vote already exists
  const existingVote = db.prepare('SELECT * FROM governance_votes WHERE proposal_id = ? AND worker_id = ?').get(id, voterId);
  if (existingVote) {
    return res.status(400).json({ error: 'You have already cast your democratic ballot for this proposal.' });
  }

  // Record vote
  db.prepare(`
    INSERT INTO governance_votes (id, proposal_id, worker_id, choice)
    VALUES (?, ?, ?, ?)
  `).run(`vote-${Date.now()}`, id, voterId, choice);

  // Update tally
  if (choice === 'FOR') {
    db.prepare('UPDATE governance_proposals SET votes_for = votes_for + 1 WHERE id = ?').run(id);
  } else if (choice === 'AGAINST') {
    db.prepare('UPDATE governance_proposals SET votes_against = votes_against + 1 WHERE id = ?').run(id);
  } else {
    db.prepare('UPDATE governance_proposals SET votes_abstain = votes_abstain + 1 WHERE id = ?').run(id);
  }

  return res.json({ message: 'Democratic ballot recorded successfully', choice });
});

export default router;
