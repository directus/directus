import type { FastifyInstance } from 'fastify';
import Type, { type Static } from 'typebox';
import { forbiddenError } from '../errors.js';
import { requireLicense } from '../hooks/require-license.js';
import { licenseStore } from '../store.js';
import { LicenseAuthHeaders, type LicenseAuthHeadersType } from '../types.js';
import { createToken } from '../utils.js';

export const UpdateRequestSchema = Type.Object({
	license_key: Type.String({
		minLength: 1,
		maxLength: 64,
	}),
});

export type UpdateRequestSchema = Static<typeof UpdateRequestSchema>;

export async function updateRoute(app: FastifyInstance) {
	app.post<{ Headers: LicenseAuthHeadersType; Body: UpdateRequestSchema }>(
		'/',
		{
			schema: {
				headers: LicenseAuthHeaders,
				body: UpdateRequestSchema,
			},
			preHandler: requireLicense,
		},
		async (req, res) => {
			const project_id = req.headers['directus-project-id'];
			const public_url = req.headers['directus-public-url'];

			const new_license = Object.values(licenseStore).find(
				(license) =>
					license.key === req.body.license_key &&
					license.projects.every(({ id, url }) => id !== project_id && url !== public_url),
			);

			if (!new_license) {
				return res.status(400).send(forbiddenError('New License not found'));
			}

			req.license.projects = req.license.projects.filter(({ id, url }) => id !== project_id || url !== public_url);

			new_license.projects.push({ id: project_id, url: public_url });

			return res.status(200).send({
				token: await createToken(new_license),
			});
		},
	);
}
