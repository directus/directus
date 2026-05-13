import type { FastifyInstance } from 'fastify';
import Type, { type Static } from 'typebox';
import { notFoundError } from '../errors.js';
import { licenseStore } from '../store.js';

export const PreviewRequestSchema = Type.Object({
	license_key: Type.String({
		minLength: 1,
		maxLength: 64,
	}),
});

export type PreviewRequestBody = Static<typeof PreviewRequestSchema>;

export async function previewRoute(app: FastifyInstance) {
	app.post<{ Body: PreviewRequestBody }>(
		'/',
		{
			schema: {
				body: PreviewRequestSchema,
			},
		},
		async (req, res) => {
			const key = req.body.license_key;

			const license = licenseStore[key];

			if (!license) return res.status(404).send(notFoundError('License not available'));

			return res.status(200).send({
				plan_name: license.name,
				expires_at: license.meta.expires_at,
				renews_at: license.meta.renews_at,
				entitlements: license.entitlements,
			});
		},
	);
}
