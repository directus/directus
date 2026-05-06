import type { FastifyInstance } from 'fastify';
import Type, { type Static } from 'typebox';
import { notFoundError } from '../errors.js';
import { licenses } from '../licenses.js';
import { createNewToken } from '../token.js';
import { LicenseAuthHeaders, type LicenseAuthHeadersType } from '../types.js';

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
	app.post<{ Headers: LicenseAuthHeadersType; Body: RefreshRequestBody }>(
		'/',
		{
			schema: {
				body: RefreshRequestBody,
				headers: LicenseAuthHeaders,
			},
		},
		async (req, res) => {
			const license = licenses[req.headers.license_key];

			if (
				!license ||
				license.projects.every(({ id, url }) => id !== req.headers.license_key && url !== req.headers.public_url)
			)
				return res.status(404).send(notFoundError('License not available'));

			return res.status(200).send({
				token: await createNewToken(license),
			});
		},
	);
}
