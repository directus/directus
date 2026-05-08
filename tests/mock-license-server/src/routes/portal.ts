import { hash } from 'crypto';
import type { FastifyInstance } from 'fastify';
import { forbiddenError } from '../errors.js';
import { licenses } from '../licenses.js';
import { LicenseAuthHeaders, type LicenseAuthHeadersType } from '../types.js';

export async function portalRoute(app: FastifyInstance) {
	app.post<{ Headers: LicenseAuthHeadersType }>(
		'/',
		{
			schema: {
				headers: LicenseAuthHeaders,
			},
		},
		async (req, res) => {
			const license_key = req.headers['directus-license-key'];
			const project_id = req.headers['directus-project-id'];
			const public_url = req.headers['directus-public-url'];

			const license = Object.values(licenses).find(
				(license) =>
					license.key === license_key &&
					license.projects.find(({ id, url }) => id === project_id && url === public_url),
			);

			if (!license) return res.status(400).send(forbiddenError('License not found'));

			return res.status(200).send({
				url: `https://shop.nitwel.no/sessions/${hash('sha256', Buffer.from(project_id + public_url), 'hex')}`,
			});
		},
	);
}
