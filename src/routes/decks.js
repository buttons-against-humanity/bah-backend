import express from 'express';
import { getExpansions } from '../models/Deck';

const router = express.Router();

router.get('/expansions', (req, res) => {
  res.json({
    expansions: getExpansions()
  });
});

export default router;
