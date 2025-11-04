import { ErrorCode, ForbiddenError, isDirectusError, RouteNotFoundError } from '@directus/errors';
import { format } from 'date-fns';
import { Router } from 'express';
import { respond } from '../middleware/respond.js';
import { SettingsService } from '../services/index.js';
import { ServerService } from '../services/server.js';
import { SpecificationService } from '../services/specifications.js';
import asyncHandler from '../utils/async-handler.js';
import { createAdmin } from '../utils/create-admin.js';

const router = Router();

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

router.post(
	'/setup',
	asyncHandler(async (req, _res, next) => {
		const serverService = new ServerService({ schema: req.schema });

		if (await serverService.isSetupCompleted()) {
			throw new ForbiddenError();
		}

		try {
			await createAdmin(req.schema, {
				email: req.body.project_owner,
				password: req.body.password,
				first_name: req.body.first_name,
				last_name: req.body.last_name,
			});

			const settingsService = new SettingsService({ schema: req.schema });

			settingsService.setOwner(req.body);
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
