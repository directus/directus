import type { FastifyInstance } from 'fastify';
import Type, { type Static } from 'typebox';
import { forbiddenError, notFoundError } from '../errors.js';
import { requireLicense } from '../hooks/require-license.js';
import { LicenseAuthHeaders, type LicenseAuthHeadersType } from '../types.js';
import { createToken } from '../utils.js';

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

export async function addonsRoute(app: FastifyInstance) {
	app.get<{ Headers: LicenseAuthHeadersType }>(
		'/options',
		{
			schema: {
				headers: LicenseAuthHeaders,
			},
			preHandler: requireLicense,
		},
		async (req, res) => {
			return res.status(200).send({ available_addons: req.license.addons });
		},
	);

	app.patch<{ Headers: LicenseAuthHeadersType; Body: UpdateAddonsRequestBody }>(
		'/',
		{
			schema: {
				headers: LicenseAuthHeaders,
				body: UpdateAddonsRequestSchema,
			},
			preHandler: requireLicense,
		},
		async (req, res) => {
			for (const { addon_id, quantity } of req.body.addons) {
				const addon = req.license.addons.find((a) => a.id === addon_id);
				if (!addon) return res.status(404).send(notFoundError(`Addon ${addon_id} not available`));

				if (quantity < addon.min_quantity || quantity > addon.max_quantity) {
					return res.status(400).send(forbiddenError(`Quantity ${quantity} out of range for addon ${addon_id}`));
				}

				req.license.entitlements[addon.unit].limit += quantity - addon.active_quantity;

				req.license.entitlements[addon.unit].addon =
					(req.license.entitlements[addon.unit].addon ?? 0) + quantity - addon.active_quantity;

				if (req.license.entitlements[addon.unit].addon === 0) {
					delete req.license.entitlements[addon.unit].addon;
				}

				addon.active_quantity = quantity;
			}

			return res.status(200).send({
				token: await createToken(req.license),
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
			preHandler: requireLicense,
		},
		async (req, res) => {
			for (const addon_id of req.body) {
				const addon = req.license.addons.find((a) => a.id === addon_id);

				if (!addon) return res.status(404).send(notFoundError(`Addon ${addon_id} not available`));

				req.license.entitlements[addon.unit].limit -= addon.active_quantity;

				delete req.license.entitlements[addon.unit].addon;

				addon.active_quantity = 0;
			}

			return res.status(204).send();
		},
	);
}
