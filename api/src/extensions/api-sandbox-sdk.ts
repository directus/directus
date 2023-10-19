import type { Reference } from 'isolated-vm';
import { setTimeout } from 'node:timers/promises';
import logger from '../logger.js';

export function log(message: Reference<string>): void {
	if (message.typeof !== 'string') throw new Error('Log message has to be of type string');

	logger.info(message.copySync());
}

export async function sleep(milliseconds: Reference<number>): Promise<void> {
	if (milliseconds.typeof !== 'number') throw new Error('Sleep milliseconds has to be of type number');

	await setTimeout(await milliseconds.copy());
}
