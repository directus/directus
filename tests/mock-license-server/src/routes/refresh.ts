import type { FastifyInstance } from 'fastify';
import Type, { type Static } from 'typebox';
import { requireLicense } from '../hooks/require-license.js';
import { LicenseAuthHeaders, type LicenseAuthHeadersType } from '../types.js';
import { createToken } from '../utils.js';

export const RefreshRequestBody = Type.Object(
	{
		usage_metrics: Type.Object(
			{
				seats: Type.Number(),
				collections: Type.Number(),
				flows: Type.Number(),
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
	app.post<{ Headers: LicenseAuthHeadersType; Body: RefreshRequestBody }>(
		'/',
		{
			schema: {
				body: RefreshRequestBody,
				headers: LicenseAuthHeaders,
			},
			preHandler: requireLicense,
		},
		async (req, res) => {
			return res.status(200).send({
				token: await createToken(req.license),
			});
		},
	);
}
