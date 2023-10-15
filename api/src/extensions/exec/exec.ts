import assert from 'node:assert';
import logger from '../../logger.js';
import { handlers } from './handlers/index.js';
import { isValidHandler } from './util/is-valid-handler.js';

/**
 * Execute a secure operation
 */
export const exec = async (type: unknown, ...args: unknown[]) => {
	assert(typeof type === 'string', 'Type argument must be of type string');
	assert(!!type, 'Type argument cannot be falsy');

	try {
		if (isValidHandler(type)) {
			const { handler, schema } = handlers[type];

			/** @TODO gotta do some more typescript wizardly to get this to properly read the types */
			await (handler as any)(...(schema.parse(args) as any));
		} else {
			throw new Error(`Type "${type}" isn't a valid handler type`);
		}
	} catch (err) {
		logger.warn(err);
	}
};
