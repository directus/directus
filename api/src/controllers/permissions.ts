import express from 'express';
import asyncHandler from 'express-async-handler';
import sanitizeQuery from '../middleware/sanitize-query';
import PermissionsService from '../services/permissions';
import useCollection from '../middleware/use-collection';
import MetaService from '../services/meta';
import { InvalidCredentialsException } from '../exceptions';

const router = express.Router();

router.use(useCollection('directus_permissions'));

router.post(
	'/',
	asyncHandler(async (req, res) => {
		const service = new PermissionsService({ accountability: req.accountability });
		const primaryKey = await service.create(req.body);
		const item = await service.readByKey(primaryKey, req.sanitizedQuery);

		return res.json({ data: item || null });
	})
);

router.get(
	'/',
	sanitizeQuery,
	asyncHandler(async (req, res) => {
		const service = new PermissionsService({ accountability: req.accountability });
		const metaService = new MetaService({ accountability: req.accountability });

		const item = await service.readByQuery(req.sanitizedQuery);
		const meta = await metaService.getMetaForQuery(req.collection, req.sanitizedQuery);

		return res.json({ data: item || null, meta });
	})
);

router.get(
	'/me',
	sanitizeQuery,
	asyncHandler(async (req, res) => {
		if (!req.accountability?.user || !req.accountability?.role) {
			throw new InvalidCredentialsException();
		}

		const service = new PermissionsService();
		const query = req.sanitizedQuery || {};

		query.filter = {
			...(query.filter || {}),
			role: {
				_eq: req.accountability.role
			}
		}

		const items = await service.readByQuery(req.sanitizedQuery);

		return res.json({ data: items || null });
	})
)

router.get(
	'/:pk',
	sanitizeQuery,
	asyncHandler(async (req, res) => {
		const service = new PermissionsService({ accountability: req.accountability });
		const record = await service.readByKey(Number(req.params.pk), req.sanitizedQuery);
		return res.json({ data: record || null });
	})
);

router.patch(
	'/:pk',
	asyncHandler(async (req, res) => {
		const service = new PermissionsService({ accountability: req.accountability });
		const primaryKey = await service.update(req.body, Number(req.params.pk));

		const item = await service.readByKey(primaryKey, req.sanitizedQuery);

		return res.json({ data: item || null });
	})
);

router.delete(
	'/:pk',
	asyncHandler(async (req, res) => {
		const service = new PermissionsService({ accountability: req.accountability });
		await service.delete(Number(req.params.pk));

		return res.status(200).end();
	})
);

export default router;
