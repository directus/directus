import { randomUUID } from 'crypto';
import type { FastifyInstance } from 'fastify';
import Type, { type Static } from 'typebox';
import { forbiddenError, notFoundError } from '../errors.js';
import { licenseStore } from '../store.js';
import type { MockLicense } from '../types.js';
import { createToken } from '../utils.js';

export const ActivateRequestSchema = Type.Object({
	license_key: Type.String({ minLength: 1 }),
	project_id: Type.String({ minLength: 1 }),
	public_url: Type.String({ minLength: 1 }),
});

export type ActivateRequestBody = Static<typeof ActivateRequestSchema>;

export async function activateRoute(app: FastifyInstance) {
	app.post<{ Body: ActivateRequestBody }>(
		'/',
		{
			schema: {
				body: ActivateRequestSchema,
			},
		},
		async (req, res) => {
			const { license_key, project_id, public_url } = req.body;

			const license = licenseStore[license_key];

			if (!license) return res.status(404).send(notFoundError('License not available'));

			if (license.projects.length >= license.max_projects)
				return res.status(400).send(forbiddenError('License usage limit reached'));

			if (license.projects.some(({ id, url }) => id === project_id && url === public_url))
				return res.status(400).send(forbiddenError('License already used'));

			let collidingLicense: MockLicense | undefined;

			for (const license of Object.values(licenseStore)) {
				if (license.key === license_key) continue;

				for (const { id, url } of license.projects) {
					if (id !== project_id) continue;

					if (url === public_url) {
						return res.status(400).send(forbiddenError('Project already used by different license key'));
					} else {
						collidingLicense = license;
					}
				}
			}

			if (collidingLicense) {
				const new_project_id = randomUUID();
				license.projects.push({ id: new_project_id, url: public_url });

				return res.status(200).send({
					token: await createToken(license),
					new_project_id,
				});
			}

			license.projects.push({ id: project_id, url: public_url });

			return res.status(200).send({
				token: await createToken(license),
			});
		},
	);
}
