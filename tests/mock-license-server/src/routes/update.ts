import type { FastifyInstance } from 'fastify';
import Type, { type Static } from 'typebox';
import { forbiddenError } from '../errors.js';
import { licenses } from '../licenses.js';
import { createNewToken } from '../token.js';
import { LicenseAuthHeaders, type LicenseAuthHeadersType } from '../types.js';

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
		},
		async (req, res) => {
			const license_key = req.headers['directus-license-key'];
			const project_id = req.headers['directus-project-id'];
			const public_url = req.headers['directus-public-url'];

			const old_license = Object.values(licenses).find(
				(license) =>
					license.key === license_key &&
					license.projects.find(({ id, url }) => id === project_id && url === public_url),
			);

			const new_license = Object.values(licenses).find(
				(license) =>
					license.key === req.body.license_key &&
					license.projects.every(({ id, url }) => id !== project_id && url !== public_url),
			);

			if (!old_license) {
				return res.status(400).send(forbiddenError('Old License not found'));
			}

			if (!new_license) {
				return res.status(400).send(forbiddenError('New License not found'));
			}

			old_license.projects = old_license.projects.filter(({ id, url }) => id !== project_id || url !== public_url);
			new_license.projects.push({ id: project_id, url: public_url });

			return res.status(200).send({
				token: await createNewToken(new_license),
			});
		},
	);
}
