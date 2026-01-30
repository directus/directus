import { Router } from 'express';
import asyncHandler from '../../utils/async-handler.js';
import { loadSettings } from '../chat/middleware/load-settings.js';
import { aiFileUploadHandler } from './controllers/upload.js';

export const aiFilesRouter = Router().post('/', asyncHandler(loadSettings), asyncHandler(aiFileUploadHandler));
