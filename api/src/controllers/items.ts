import express from 'express';
import Busboy from 'busboy';
import asyncHandler from '../utils/async-handler';
import collectionExists from '../middleware/collection-exists';
import { ItemsService, MetaService, XliffService } from '../services';
import { RouteNotFoundException, ForbiddenException, InvalidPayloadException } from '../exceptions';
import { respond } from '../middleware/respond';
import { PrimaryKey } from '../types';
import { validateBatch } from '../middleware/validate-batch';
import logger from '../logger';

const router = express.Router();

router.post(
	'/:collection',
	collectionExists,
	asyncHandler(async (req, res, next) => {
		if (req.params.collection.startsWith('directus_')) throw new ForbiddenException();

		if (req.singleton) {
			throw new RouteNotFoundException(req.path);
		}

		const service = new ItemsService(req.collection, {
			accountability: req.accountability,
			schema: req.schema,
		});

		const savedKeys: PrimaryKey[] = [];

		if (Array.isArray(req.body)) {
			const keys = await service.createMany(req.body);
			savedKeys.push(...keys);
		} else {
			const key = await service.createOne(req.body);
			savedKeys.push(key);
		}

		try {
			if (Array.isArray(req.body)) {
				const result = await service.readMany(savedKeys, req.sanitizedQuery);
				res.locals.payload = { data: result || null };
			} else {
				const result = await service.readOne(savedKeys[0], req.sanitizedQuery);
				res.locals.payload = { data: result || null };
			}
		} catch (error) {
			if (error instanceof ForbiddenException) {
				return next();
			}

			throw error;
		}

		return next();
	}),
	respond
);

const readHandler = asyncHandler(async (req, res, next) => {
	if (req.params.collection.startsWith('directus_')) throw new ForbiddenException();

	const service = new ItemsService(req.collection, {
		accountability: req.accountability,
		schema: req.schema,
	});

	const metaService = new MetaService({
		accountability: req.accountability,
		schema: req.schema,
	});

	let result;

	if (req.singleton) {
		result = await service.readSingleton(req.sanitizedQuery);
	} else if (req.body.keys) {
		result = await service.readMany(req.body.keys, req.sanitizedQuery);
	} else {
		result = await service.readByQuery(req.sanitizedQuery);
	}

	const meta = await metaService.getMetaForQuery(req.collection, req.sanitizedQuery);

	res.locals.payload = {
		meta: meta,
		data: result,
	};

	return next();
});

router.search('/:collection', collectionExists, validateBatch('read'), readHandler, respond);
router.get('/:collection', collectionExists, readHandler, respond);

router.get(
	'/:collection/:pk',
	collectionExists,
	asyncHandler(async (req, res, next) => {
		if (req.params.collection.startsWith('directus_')) throw new ForbiddenException();

		if (req.singleton) {
			throw new RouteNotFoundException(req.path);
		}

		const service = new ItemsService(req.collection, {
			accountability: req.accountability,
			schema: req.schema,
		});

		const result = await service.readOne(req.params.pk, req.sanitizedQuery);

		res.locals.payload = {
			data: result || null,
		};
		return next();
	}),
	respond
);

router.patch(
	'/:collection',
	collectionExists,
	validateBatch('update'),
	asyncHandler(async (req, res, next) => {
		if (req.params.collection.startsWith('directus_')) throw new ForbiddenException();

		const service = new ItemsService(req.collection, {
			accountability: req.accountability,
			schema: req.schema,
		});

		if (req.singleton === true) {
			await service.upsertSingleton(req.body);
			const item = await service.readSingleton(req.sanitizedQuery);

			res.locals.payload = { data: item || null };
			return next();
		}

		let keys: PrimaryKey[] = [];

		if (req.body.keys) {
			keys = await service.updateMany(req.body.keys, req.body.data);
		} else {
			keys = await service.updateByQuery(req.body.query, req.body.data);
		}

		try {
			const result = await service.readMany(keys, req.sanitizedQuery);
			res.locals.payload = { data: result };
		} catch (error) {
			if (error instanceof ForbiddenException) {
				return next();
			}

			throw error;
		}

		return next();
	}),
	respond
);

router.patch(
	'/:collection/:pk',
	collectionExists,
	asyncHandler(async (req, res, next) => {
		if (req.params.collection.startsWith('directus_')) throw new ForbiddenException();

		if (req.singleton) {
			throw new RouteNotFoundException(req.path);
		}

		const service = new ItemsService(req.collection, {
			accountability: req.accountability,
			schema: req.schema,
		});

		const updatedPrimaryKey = await service.updateOne(req.params.pk, req.body);

		try {
			const result = await service.readOne(updatedPrimaryKey, req.sanitizedQuery);
			res.locals.payload = { data: result || null };
		} catch (error) {
			if (error instanceof ForbiddenException) {
				return next();
			}

			throw error;
		}

		return next();
	}),
	respond
);

router.delete(
	'/:collection',
	collectionExists,
	validateBatch('delete'),
	asyncHandler(async (req, res, next) => {
		if (req.params.collection.startsWith('directus_')) throw new ForbiddenException();

		const service = new ItemsService(req.collection, {
			accountability: req.accountability,
			schema: req.schema,
		});

		if (Array.isArray(req.body)) {
			await service.deleteMany(req.body);
		} else if (req.body.keys) {
			await service.deleteMany(req.body.keys);
		} else {
			await service.deleteByQuery(req.body.query);
		}

		return next();
	}),
	respond
);

router.delete(
	'/:collection/:pk',
	collectionExists,
	asyncHandler(async (req, res, next) => {
		if (req.params.collection.startsWith('directus_')) throw new ForbiddenException();

		const service = new ItemsService(req.collection, {
			accountability: req.accountability,
			schema: req.schema,
		});

		await service.deleteOne(req.params.pk);
		return next();
	}),
	respond
);

const multipartHandler = asyncHandler(async (req, res, next) => {
	if (req.is('multipart/form-data') === false) return next();
	const busboy = new Busboy({ headers: req.headers });
	let fileCount = 0;
	res.locals.fields = {};
	busboy.on('field', (fieldname: keyof File, val) => {
		res.locals.fields[fieldname] = val;
	});
	busboy.on('file', async (fieldname, fileStream, filename, encoding, mimetype) => {
		fileCount++;
		const { format } = res.locals.fields;
		if (['xliff', 'xliff2'].includes(format)) {
			if (fileCount > 1) {
				busboy.emit('error', new InvalidPayloadException(`Only one import file can be used for XLIFF format.`));
			}
			let content = '';
			fileStream.on('data', (d) => (content += d)).on('end', () => (res.locals.data = content));
		} else {
			busboy.emit(
				'error',
				new InvalidPayloadException(`Only XLIFF 1.2/2.0 formats are available for import right now.`)
			);
		}
	});
	busboy.on('error', (error: Error) => {
		next(error);
	});

	busboy.on('finish', () => {
		next();
	});
	req.pipe(busboy);
});

router.post(
	'/:collection/import',
	multipartHandler,
	asyncHandler(async (req, res, next) => {
		if (req.is('multipart/form-data')) {
			const { format, language, languageField, parentKeyField, parentCollection } = res.locals.fields;
			if (['xliff', 'xliff2'].includes(format) && res.locals.data) {
				const xliffService = new XliffService({
					accountability: req.accountability,
					schema: req.schema,
					language,
					format,
				});

				try {
					const savedKeys = await xliffService.fromXliff(
						req.params.collection,
						parentCollection,
						parentKeyField,
						languageField,
						res.locals.data
					);
					res.locals.payload = { data: savedKeys || null };
				} catch (error) {
					if (error instanceof ForbiddenException) {
						return next();
					}
					logger.error(error);
					throw error;
				}
			}
			return next();
		}
	}),
	respond
);

export default router;
