import type { FastifyInstance } from 'fastify';
import { forbiddenError } from '../errors.js';
import { licenses } from '../licenses.js';
import { LicenseAuthHeaders, type LicenseAuthHeadersType } from '../types.js';

export async function deactivateRoute(app: FastifyInstance) {
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
			const public_url = req.headers['directus-project-url'];

			const license = Object.values(licenses).find(
				(license) =>
					license.key === license_key &&
					license.projects.find(({ id, url }) => id === project_id && url === public_url),
			);

			if (!license) return res.status(400).send(forbiddenError('License not found'));

			license.projects = license.projects.filter(({ id, url }) => id !== project_id || url !== public_url);

			return res.status(204);
		},
	);
}
