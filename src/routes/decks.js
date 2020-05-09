import express from 'express';
import { getExpansions, reLoadDeck } from '../models/Deck';
import crypto from 'crypto';

const router = express.Router();

const adminToken = process.env.ADMIN_TOKEN || '';

const isAuthorized = function(req) {
  if (!adminToken) {
    return false;
  }
  const authorization = req.header('Authorization');
  if (!authorization) {
    return false;
  }
  if (!authorization) {
    return false;
  }
  const pieces = authorization.split(' ');
  if (pieces[0] !== 'Bearer') {
    return false;
  }
  if (pieces.length !== 2) {
    return false;
  }
  const token = pieces[1].trim();
  if (!token) {
    return false;
  }
  return (
    adminToken ===
    crypto
      .createHash('sha256')
      .update(token)
      .digest('hex')
  );
};

router.post('/', async function(req, res) {
  if (!isAuthorized(req)) {
    res.sendStatus(401);
    return;
  }
  try {
    await reLoadDeck(process.env.COCKPIT_URL);
    res.sendStatus(204);
  } catch (e) {
    console.error(e);
    res.sendStatus(500);
  }
});

router.get('/expansions', (req, res) => {
  res.json({
    expansions: getExpansions()
  });
});

export default router;
