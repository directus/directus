/**
 * Require the Directus-License-Version header on all license-server routes.
 * The header must be a date in YYYY-MM-DD form.
 */

import type { preHandlerHookHandler } from 'fastify';
import { badRequestError } from '../errors.js';

const LICENSE_VERSION_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const requireLicenseVersion: preHandlerHookHandler = async (req, reply) => {
	const license_version = req.headers['directus-license-version'];

	if (typeof license_version !== 'string' || !LICENSE_VERSION_PATTERN.test(license_version)) {
		return reply.status(400).send(badRequestError('Missing or malformed Directus-License-Version header'));
	}
};
