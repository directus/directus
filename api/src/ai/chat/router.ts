import asyncHandler from '@/utils/async-handler.js';
import { Router } from 'express';
import { aiChatPostHandler } from './controllers/chat.post.js';
import { loadSettings } from './middleware/load-settings.js';

export const aiChatRouter = Router().post('/', asyncHandler(loadSettings), asyncHandler(aiChatPostHandler));
