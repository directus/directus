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
				flows: Type.Number(),
			},
			{
				additionalProperties: false,
			},
		),
		new_public_url: Type.Optional(Type.String({ minLength: 1 })),
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
			const license_key = req.headers['directus-license-key'];
			const project_id = req.headers['directus-project-id'];
			const public_url = req.headers['directus-project-url'];

			const license = licenses[license_key];

			if (!license || license.projects.some(({ id, url }) => id === project_id && url === public_url)) {
				return res.status(404).send(notFoundError('License not available'));
			}

			// Honor public_url change: replace the project entry with the new url
			if (req.body.new_public_url) {
				// TBD
			}

			return res.status(200).send({
				token: await createNewToken(license),
			});
		},
	);
}
