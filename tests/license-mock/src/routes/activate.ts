import { randomUUID } from 'crypto';
import type { FastifyInstance } from 'fastify';
import Type, { type Static } from 'typebox';
import { ErrorCode, forbiddenError, notFoundError } from '../errors.js';
import { licenses } from '../licenses.js';

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
			const { license_key, project_id, public_url: _public_url } = req.body;

			const license = licenses.find((license) => license.key === license_key);

			if (!license) return res.status(404).send(notFoundError('License not available'));

			if (license.activated) return res.status(400).send(forbiddenError('License is already active'));

			if (license.project_id === project_id) {
				return res.code(200).send({ token: license.token });
			}

			if (license.project_id && license.project_id !== project_id) {
				return res
					.code(403)
					.send(forbiddenError('License is already bound to a different project', ErrorCode.LICENSE_BOUND));
			}

			const collidingLicense = licenses.find((license) => license.project_id === project_id);

			if (collidingLicense) {
				return res.status(200).send({
					token: license.token,
					new_project_id: randomUUID(),
				});
			}

			return res.status(200).send({
				token: license.token,
			});
		},
	);
}
