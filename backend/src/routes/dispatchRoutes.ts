import { Router, Request, Response } from 'express';
import { evaluateFairDispatch, DEFAULT_WEIGHTS } from '../modules/dispatch/dispatchEngine';

const router = Router();

// POST /api/v1/dispatch/simulate - Interactive FairDispatch Inspector & Scenario Simulator
router.post('/simulate', (req: Request, res: Response) => {
  const { lat, lng, serviceCategory, customWeights } = req.body;

  const targetLat = lat || 12.9716;
  const targetLng = lng || 77.5946;
  const requiredSkill = serviceCategory || 'Electrical';

  const weights = customWeights || DEFAULT_WEIGHTS;

  const evaluationResult = evaluateFairDispatch(
    `sim-${Date.now()}`,
    targetLat,
    targetLng,
    requiredSkill,
    weights
  );

  return res.json({
    message: 'FairDispatch Simulation Completed',
    targetLocation: { lat: targetLat, lng: targetLng },
    requiredSkill,
    evaluationResult,
  });
});

export default router;
