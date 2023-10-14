import { z } from 'zod';
import logger from '../../../logger.js';
import { defineHandler } from '../define.js';

export default defineHandler(z.tuple([z.string()]), async (message) => {
	logger.info(message);
});
