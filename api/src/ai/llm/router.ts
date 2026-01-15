import { Router } from 'express';
import { respond } from '../../middleware/respond.js';
import asyncHandler from '../../utils/async-handler.js';
import { aiChatPostHandler } from './controllers/chat.post.js';
import { aiObjectPostHandler } from './controllers/object.post.js';
import { loadSettings } from './middleware/load-settings.js';

export const llmRouter = Router()
	.use(asyncHandler(loadSettings))
	.post('/chat' , asyncHandler(aiChatPostHandler))
	.post('/object', asyncHandler(aiObjectPostHandler), respond);
