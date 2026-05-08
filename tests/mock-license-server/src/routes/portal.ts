import { hash } from 'crypto';
import type { FastifyInstance } from 'fastify';
import { requireLicense } from '../hooks/require-license.js';
import { LicenseAuthHeaders, type LicenseAuthHeadersType } from '../types.js';

export async function portalRoute(app: FastifyInstance) {
	app.post<{ Headers: LicenseAuthHeadersType }>(
		'/',
		{
			schema: {
				headers: LicenseAuthHeaders,
			},
			preHandler: requireLicense,
		},
		async (req, res) => {
			const project_id = req.headers['directus-project-id'];
			const public_url = req.headers['directus-public-url'];

			return res.status(200).send({
				url: `https://shop.nitwel.no/sessions/${hash('sha256', Buffer.from(project_id + public_url), 'hex')}`,
			});
		},
	);
}
