import { aiChatPostHandler } from './controllers/chat.post.js';
import { loadSettings } from './middleware/load-settings.js';
import asyncHandler from '../../utils/async-handler.js';
import { Router } from 'express';

export const aiChatRouter = Router().post('/', asyncHandler(loadSettings), asyncHandler(aiChatPostHandler));
