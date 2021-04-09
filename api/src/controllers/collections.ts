import { Router } from 'express';
import Busboy from 'busboy';
import asyncHandler from '../utils/async-handler';
import { CollectionsService, MetaService, XliffService } from '../services';
import { ForbiddenException, InvalidPayloadException } from '../exceptions';
import { respond } from '../middleware/respond';

const router = Router();

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
				busboy.emit('error', new InvalidPayloadException(`Only one import file supported for XLIFF format.`));
			}
			let content = '';
			fileStream.on('data', (d) => (content += d)).on('end', () => (res.locals.data = content));
		} else {
			busboy.emit('error', new InvalidPayloadException(`Only XLIFF 1.2/2.0 is supported.`));
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
	'/',
	asyncHandler(async (req, res, next) => {
		const collectionsService = new CollectionsService({
			accountability: req.accountability,
			schema: req.schema,
		});

		const collectionKey = await collectionsService.create(req.body);
		const record = await collectionsService.readByKey(collectionKey);

		res.locals.payload = { data: record || null };
		return next();
	}),
	respond
);

router.get(
	'/',
	asyncHandler(async (req, res, next) => {
		const collectionsService = new CollectionsService({
			accountability: req.accountability,
			schema: req.schema,
		});
		const metaService = new MetaService({
			accountability: req.accountability,
			schema: req.schema,
		});

		const collections = await collectionsService.readByQuery();
		const meta = await metaService.getMetaForQuery('directus_collections', {});

		res.locals.payload = { data: collections || null, meta };
		return next();
	}),
	respond
);

router.get(
	'/:collection',
	asyncHandler(async (req, res, next) => {
		const collectionsService = new CollectionsService({
			accountability: req.accountability,
			schema: req.schema,
		});
		const collection = await collectionsService.readByKey(req.params.collection);
		res.locals.payload = { data: collection || null };

		return next();
	}),
	respond
);

router.patch(
	'/:collection',
	asyncHandler(async (req, res, next) => {
		const collectionsService = new CollectionsService({
			accountability: req.accountability,
			schema: req.schema,
		});
		await collectionsService.update(req.body, req.params.collection);

		try {
			const collection = await collectionsService.readByKey(req.params.collection);
			res.locals.payload = { data: collection || null };
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

router.post(
	'/:collection',
	multipartHandler,
	asyncHandler(async (req, res, next) => {
		if (req.is('multipart/form-data')) {
			const { format, language } = res.locals.fields;
			if (['xliff', 'xliff2'].includes(format) && res.locals.data) {
				const collectionKey = req.params.collection;
				const xliffService = new XliffService({
					accountability: req.accountability,
					schema: req.schema,
					language,
					format,
				});
				try {
					const savedKeys = await xliffService.fromXliff(
						collectionKey,
						res.locals.data,
						req.query.field as string | undefined
					);
					res.locals.payload = { data: savedKeys || null };
				} catch (error) {
					if (error instanceof ForbiddenException) {
						return next();
					}
					throw error;
				}
			}
			return next();
		}
	}),
	respond
);

router.delete(
	'/:collection',
	asyncHandler(async (req, res, next) => {
		const collectionsService = new CollectionsService({
			accountability: req.accountability,
			schema: req.schema,
		});

		await collectionsService.delete(req.params.collection);

		return next();
	}),
	respond
);

export default router;
