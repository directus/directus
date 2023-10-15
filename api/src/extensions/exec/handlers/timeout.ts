import { setTimeout } from 'node:timers/promises';
import { z } from 'zod';
import { defineHandler } from '../define.js';

/**
 * Just a testing handler to try out async operations
 */
export default defineHandler(z.tuple([z.string()]), async () => {
	await setTimeout(1000);
});
