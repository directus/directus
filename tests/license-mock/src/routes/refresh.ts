import type { FastifyInstance } from 'fastify';
import Type, { type Static } from 'typebox';
import { forbiddenError, notFoundError } from '../errors.js';
import { licenses } from '../licenses.js';
import { createNewToken } from '../token.js';

export const RefreshRequestHeaders = Type.Object(
	{
		project_id: Type.String({ minLength: 1 }),
		license_key: Type.String({ minLength: 1 }),
		public_url: Type.String({ minLength: 1 }),
	},
	{
		additionalProperties: false,
	},
);

export type RefreshRequestHeaders = Static<typeof RefreshRequestHeaders>;

export const RefreshRequestBody = Type.Object(
	{
		usage_metrics: Type.Object(
			{
				seats: Type.Number(),
				collections: Type.Number(),
			},
			{
				additionalProperties: false,
			},
		),
	},
	{
		additionalProperties: false,
	},
);

export type RefreshRequestBody = Static<typeof RefreshRequestBody>;

export async function refreshRoute(app: FastifyInstance) {
	app.post<{ Headers: RefreshRequestHeaders; Body: RefreshRequestBody }>(
		'/',
		{
			schema: {
				body: RefreshRequestBody,
				headers: RefreshRequestHeaders,
			},
		},
		async (req, res) => {
			const license = licenses[req.headers.license_key];

			if (!license) return res.status(404).send(notFoundError('License not available'));

			if (!license.activated) return res.status(400).send(forbiddenError('License not active'));

			return res.status(200).send({
				token: await createNewToken(license),
			});
		},
	);
}
