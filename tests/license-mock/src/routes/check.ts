import type { FastifyInstance } from 'fastify';
import Type, { type Static } from 'typebox';
import { ErrorCode, forbiddenError, notFoundError } from '../errors.js';
import { licenses } from '../licenses.js';

export const CheckRequestSchema = Type.Object({
	license_key: Type.String({
		minLength: 1,
		maxLength: 64,
	}),
});

export type CheckRequestBody = Static<typeof CheckRequestSchema>;

export async function checkRoute(app: FastifyInstance) {
	app.post<{ Body: CheckRequestBody }>(
		'/',
		{
			schema: {
				body: CheckRequestSchema,
			},
		},
		async (req, res) => {
			const key = req.body.license_key;

			const license = licenses[key];

			if (!license) return res.status(404).send(notFoundError('License not available'));

			if (license.activated) return res.status(400).send(forbiddenError(ErrorCode.LICENSE_CANCELED));

			return res.status(200).send({
				type: license.type,
				production_enabled: true,
				expires_at: license.token.meta.expires_at,
			});
		},
	);
}
