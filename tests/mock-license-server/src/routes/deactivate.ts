import type { FastifyInstance } from 'fastify';
import { requireLicense } from '../hooks/require-license.js';
import { LicenseAuthHeaders, type LicenseAuthHeadersType } from '../types.js';

export async function deactivateRoute(app: FastifyInstance) {
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

			req.license.projects = req.license.projects.filter(({ id, url }) => id !== project_id || url !== public_url);

			return res.status(204).send();
		},
	);
}
