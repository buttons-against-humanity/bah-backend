import express from 'express';
import decks from './decks';
import packageJson from '../../package.json';
import StatsManager from '../managers/StatsManager';
import MultiNodeHelper from '../helpers/multiNodeHelper';
import { getGameManager } from '../helpers/gameHelper';

const slackin = process.env.SLACKIN_URL;

const router = express.Router();

const uptime_start = Date.now();

const stickyCookie = MultiNodeHelper.getCookie();

router.get('/config', function(req, res) {
  const config = {
    stickyNode: MultiNodeHelper.isMultiNode()
  };
  if (slackin) {
    config.slackin = slackin;
  }
  if (config.stickyNode) {
    res.clearCookie(stickyCookie);
  }
  res.json(config);
});

router.post('/game', async function(req, res) {
  return res.sendStatus(204);
});

router.get('/game/:game_uuid', async function(req, res) {
  if (!MultiNodeHelper.isMultiNode()) {
    const gm = getGameManager();
    const game = await gm.exists(req.params.game_uuid);
    if (!game) {
      return res.status(404).json({ status: 404, reason: 'Not found' });
    } else {
      return res.sendStatus(204);
    }
  }
  MultiNodeHelper.getGame(req.params.game_uuid)
    .then(node => {
      req.log.debug(`${stickyCookie}: ${req.cookies[stickyCookie]} -> ${node}`);
      res.cookie(stickyCookie, node, { httpOnly: true, sameSite: 'Strict', maxAge: 60 * 60 * 2000, encode: String });
      res.json({ node });
    })
    .catch(err => {
      return res.status(404).json({ status: 404, reason: err.message });
    });
});

router.get('/uptime', function(req, res) {
  const { name, version } = packageJson;
  const { games, players, maxConcurrentPlayers } = StatsManager.getStats();
  const ret = {
    name,
    version,
    node_version: process.version,
    uptime: Math.round((Date.now() - uptime_start) / 1000),
    memoryUsage: Math.round(process.memoryUsage().rss / 1024 / 1024) + 'M',
    games,
    players,
    maxConcurrentPlayers
  };
  res.json(ret);
});

router.use('/decks', decks);

export default router;
