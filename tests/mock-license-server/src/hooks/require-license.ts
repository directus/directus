/**
 * Resolve the license bound to the request's auth headers and attach it to req.license.
 */

import type { preHandlerHookHandler } from 'fastify';
import { forbiddenError } from '../errors.js';
import { licenseStore } from '../store.js';
import type { MockLicense } from '../types.js';

declare module 'fastify' {
	interface FastifyRequest {
		license: MockLicense;
	}
}

export const requireLicense: preHandlerHookHandler = async (req, reply) => {
	const license_key = req.headers['directus-license-key'];
	const project_id = req.headers['directus-project-id'];
	const public_url = req.headers['directus-public-url'];

	if (typeof license_key !== 'string' || typeof project_id !== 'string' || typeof public_url !== 'string') {
		return reply.status(400).send(forbiddenError('License not found'));
	}

	const license = Object.values(licenseStore).find(
		(license) =>
			license.key === license_key && license.projects.some(({ id, url }) => id === project_id && url === public_url),
	);

	if (!license) {
		return reply.status(400).send(forbiddenError('License not found'));
	}

	req.license = license;
};
