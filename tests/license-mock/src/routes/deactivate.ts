import type { FastifyInstance } from 'fastify';
import Type, { type Static } from 'typebox';
import { forbiddenError } from '../errors.js';
import { licenses } from '../licenses.js';

export const DeactivateRequestSchema = Type.Object(
	{
		project_id: Type.String({ minLength: 1 }),
		license_key: Type.String({ minLength: 1 }),
		public_url: Type.String({ minLength: 1 }),
	},
	{
		additionalProperties: false,
	},
);

export type DeactivateRequestBody = Static<typeof DeactivateRequestSchema>;

export async function deactivateRoute(app: FastifyInstance) {
	app.post<{ Headers: DeactivateRequestBody }>(
		'/',
		{
			schema: {
				headers: DeactivateRequestSchema,
			},
		},
		async (req, res) => {
			const { license_key, project_id, public_url: _public_url } = req.headers;

			const license = Object.values(licenses).find(
				(license) => license.key === license_key && license.project_id === project_id,
			);

			if (!license) return res.status(400).send(forbiddenError('License not found'));

			if (!license.activated) return res.status(400).send(forbiddenError('License not active'));

			return res.status(204);
		},
	);
}
