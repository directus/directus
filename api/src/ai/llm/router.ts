import { Router } from 'express';
import asyncHandler from '../../utils/async-handler.js';
import { aiChatPostHandler } from './controllers/chat.post.js';
import { loadSettings } from './middleware/load-settings.js';

export const llmRouter = Router().post('/chat', asyncHandler(loadSettings), asyncHandler(aiChatPostHandler));
