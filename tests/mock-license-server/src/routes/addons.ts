import type { FastifyInstance } from 'fastify';
import Type, { type Static } from 'typebox';
import { forbiddenError, notFoundError } from '../errors.js';
import { licenses } from '../licenses.js';
import { createNewToken } from '../token.js';
import { LicenseAuthHeaders, type LicenseAuthHeadersType } from '../types.js';

export const UpdateAddonsRequestSchema = Type.Object(
	{
		addons: Type.Array(
			Type.Object({
				addon_id: Type.String({ minLength: 1 }),
				quantity: Type.Number(),
			}),
		),
		usage_metrics: Type.Object(
			{
				seats: Type.Number(),
				collections: Type.Number(),
				flows: Type.Number(),
			},
			{ additionalProperties: false },
		),
	},
	{ additionalProperties: false },
);

export type UpdateAddonsRequestBody = Static<typeof UpdateAddonsRequestSchema>;

export const DeleteAddonsRequestSchema = Type.Array(Type.String({ minLength: 1 }));

export type DeleteAddonsRequestBody = Static<typeof DeleteAddonsRequestSchema>;

function findLicense(license_key: string, project_id: string, public_url: string) {
	return Object.values(licenses).find(
		(license) =>
			license.key === license_key && license.projects.some(({ id, url }) => id === project_id && url === public_url),
	);
}

export async function addonsRoute(app: FastifyInstance) {
	app.get<{ Headers: LicenseAuthHeadersType }>(
		'/options',
		{
			schema: {
				headers: LicenseAuthHeaders,
			},
		},
		async (req, res) => {
			const license = findLicense(
				req.headers['directus-license-key'],
				req.headers['directus-project-id'],
				req.headers['directus-public-url'],
			);

			if (!license) return res.status(400).send(forbiddenError('License not found'));

			return res.status(200).send({ available_addons: license.addons });
		},
	);

	app.patch<{ Headers: LicenseAuthHeadersType; Body: UpdateAddonsRequestBody }>(
		'/',
		{
			schema: {
				headers: LicenseAuthHeaders,
				body: UpdateAddonsRequestSchema,
			},
		},
		async (req, res) => {
			const license = findLicense(
				req.headers['directus-license-key'],
				req.headers['directus-project-id'],
				req.headers['directus-public-url'],
			);

			if (!license) return res.status(400).send(forbiddenError('License not found'));

			for (const { addon_id, quantity } of req.body.addons) {
				const addon = license.addons.find((a) => a.id === addon_id);
				if (!addon) return res.status(404).send(notFoundError(`Addon ${addon_id} not available`));

				if (quantity < addon.min_quantity || quantity > addon.max_quantity) {
					return res.status(400).send(forbiddenError(`Quantity ${quantity} out of range for addon ${addon_id}`));
				}

				addon.active_quantity = quantity;
			}

			return res.status(200).send({
				token: await createNewToken(license),
			});
		},
	);

	app.delete<{ Headers: LicenseAuthHeadersType; Body: DeleteAddonsRequestBody }>(
		'/',
		{
			schema: {
				headers: LicenseAuthHeaders,
				body: DeleteAddonsRequestSchema,
			},
		},
		async (req, res) => {
			const license = findLicense(
				req.headers['directus-license-key'],
				req.headers['directus-project-id'],
				req.headers['directus-public-url'],
			);

			if (!license) return res.status(400).send(forbiddenError('License not found'));

			for (const addon_id of req.body) {
				const addon = license.addons.find((a) => a.id === addon_id);
				if (addon) addon.active_quantity = 0;
			}

			return res.status(204).send();
		},
	);
}
