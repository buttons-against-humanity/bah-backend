import express from 'express';
import decks from './decks';
import packageJson from '../../package.json';
import StatsManager from '../managers/StatsManager';

const router = express.Router();

const uptime_start = Date.now();

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

router.use('/cockpit', decks);

export default router;
