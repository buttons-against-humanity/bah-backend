import express from 'express';
import decks from './decks';

const router = express.Router();

router.use('/cockpit', decks);

export default router;
