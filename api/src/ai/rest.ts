import express from 'express';
import { respond } from '../middleware/respond.js';
import { restHandler as translateHandler } from './handlers/translate/index.js';

const router = express.Router();

router.post('/translate', translateHandler, respond);

export default router;
