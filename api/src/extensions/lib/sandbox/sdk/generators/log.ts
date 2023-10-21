import type { ExtensionSandboxRequestedScopes } from '@directus/extensions';
import type { Reference } from 'isolated-vm';
import logger from '../../../../../logger.js';

export function logGenerator(_requestedScopes: ExtensionSandboxRequestedScopes): (message: Reference<string>) => void {
	return (message) => {
		if (message.typeof !== 'string') throw new Error('Log message has to be of type string');

		const messageCopied = message.copySync();

		logger.info(messageCopied);
	};
}
