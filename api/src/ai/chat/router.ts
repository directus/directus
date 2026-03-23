import { Router } from 'express';
import { respond } from '../../middleware/respond.js';
import asyncHandler from '../../utils/async-handler.js';
import { aiChatPostHandler } from './controllers/chat.post.js';
import { aiObjectPostHandler } from './controllers/object.post.js';
import { loadSettings } from './middleware/load-settings.js';

export const aiRouter = Router()
	.post('/chat', asyncHandler(loadSettings), asyncHandler(aiChatPostHandler))
	.post('/object', asyncHandler(loadSettings), asyncHandler(aiObjectPostHandler), respond);
