import { Router } from 'express';
import asyncHandler from '../../utils/async-handler.js';
import { aiChatPostHandler } from './controllers/chat.post.js';
import { aiToolsGetHandler } from './controllers/tools.get.js';
import { loadSettings } from './middleware/load-settings.js';

export const aiChatRouter = Router()
	.get('/tools', asyncHandler(loadSettings), asyncHandler(aiToolsGetHandler))
	.post('/', asyncHandler(loadSettings), asyncHandler(aiChatPostHandler));
