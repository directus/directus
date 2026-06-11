import { useEnv } from '@directus/env';
import { ErrorCode, ForbiddenError, InvalidPayloadError, isDirectusError, RouteNotFoundError } from '@directus/errors';
import { toBoolean } from '@directus/utils';
import { format } from 'date-fns';
import { Router } from 'express';
import z from 'zod';
import { fromZodError } from 'zod-validation-error';
import { getLicenseManager } from '../license/manager.js';
import { respond } from '../middleware/respond.js';
import { SettingsService } from '../services/index.js';
import { ServerService } from '../services/server.js';
import { SpecificationService } from '../services/specifications.js';
import asyncHandler from '../utils/async-handler.js';
import { createAdmin } from '../utils/create-admin.js';

const router = Router();
const env = useEnv();

if (env['OPENAPI_ENABLED'] !== false) {
	router.get(
		'/specs/oas',
		asyncHandler(async (req, res, next) => {
			const service = new SpecificationService({
				accountability: req.accountability,
				schema: req.schema,
			});

			res.locals['payload'] = await service.oas.generate(req.headers.host);
			return next();
		}),
		respond,
	);
}

if (env['GRAPHQL_INTROSPECTION'] !== false) {
	router.get(
		'/specs/graphql/:scope?',
		asyncHandler(async (req, res) => {
			const service = new SpecificationService({
				accountability: req.accountability,
				schema: req.schema,
			});

			const serverService = new ServerService({
				accountability: req.accountability,
				schema: req.schema,
			});

			const scope = req.params['scope'] || 'items';

			if (['items', 'system'].includes(scope) === false) throw new RouteNotFoundError({ path: req.path });

			const info = await serverService.serverInfo();
			const result = await service.graphql.generate(scope as 'items' | 'system');
			const filename = info['project'].project_name + '_' + format(new Date(), 'yyyy-MM-dd') + '.graphql';

			res.attachment(filename);
			res.send(result);
		}),
	);
}

router.get(
	'/info',
	asyncHandler(async (req, res, next) => {
		const service = new ServerService({
			accountability: req.accountability,
			schema: req.schema,
		});

		const data = await service.serverInfo();
		res.locals['payload'] = { data };
		return next();
	}),
	respond,
);

if (toBoolean(env['HEALTHCHECK_ENABLED']) !== false) {
	router.get(
		'/health',
		asyncHandler(async (req, res, next) => {
			const service = new ServerService({
				accountability: req.accountability,
				schema: req.schema,
			});

			const data = await service.health();

			res.setHeader('Content-Type', 'application/health+json');

			if (data['status'] === 'error') res.status(503);
			res.locals['payload'] = data;
			res.locals['cache'] = false;
			return next();
		}),
		respond,
	);
}

const SetupSchema = z.object({
	admin: z.object({
		email: z.string(),
		password: z.string(),
		first_name: z.string().optional(),
		last_name: z.string().optional(),
	}),
	license_key: z.string().optional(),
	owner: z
		.object({
			project_owner: z.string().nullable(),
			project_usage: z.enum(['personal', 'commercial', 'community']).nullable(),
			org_name: z.string().nullable(),
			product_updates: z.boolean(),
		})
		.optional(),
});

router.post(
	'/setup',
	asyncHandler(async (req, _res, next) => {
		const serverService = new ServerService({ schema: req.schema });

		if (await serverService.isSetupCompleted()) {
			throw new ForbiddenError();
		}

		const { error, data } = SetupSchema.safeParse(req.body);

		if (error) {
			throw new InvalidPayloadError({ reason: fromZodError(error).message });
		}

		const licenseManager = getLicenseManager();

		try {
			// If provided ensure the license key is valid before proceeding with setup
			if (data.license_key) {
				await licenseManager.activate(data.license_key);
			}

			await createAdmin(req.schema, {
				email: data.admin.email,
				password: data.admin.password,
				first_name: data.admin.first_name,
				last_name: data.admin.last_name,
			});

			const settingsService = new SettingsService({ schema: req.schema });

			if (data.owner) {
				settingsService.setOwner(data.owner);
			}
		} catch (error: any) {
			if (isDirectusError(error, ErrorCode.Forbidden)) {
				return next();
			}

			throw error;
		}

		return next();
	}),
	respond,
);

export default router;
