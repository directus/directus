import express from 'express';
import asyncHandler from '../utils/async-handler';
import Busboy from 'busboy';
import { MetaService, FilesService } from '../services';
import { File, PrimaryKey } from '../types';
import formatTitle from '@directus/format-title';
import env from '../env';
import Joi from 'joi';
import { InvalidPayloadException, ForbiddenException } from '../exceptions';
import path from 'path';
import useCollection from '../middleware/use-collection';
import { respond } from '../middleware/respond';
import { toArray } from '../utils/to-array';
import { validateBatch } from '../middleware/validate-batch';

const router = express.Router();

router.use(useCollection('directus_files'));

const multipartHandler = asyncHandler(async (req, res, next) => {
	if (req.is('multipart/form-data') === false) return next();

	const busboy = new Busboy({ headers: req.headers });
	const savedFiles: PrimaryKey[] = [];
	const service = new FilesService({ accountability: req.accountability, schema: req.schema });

	const existingPrimaryKey = req.params.pk || undefined;

	/**
	 * The order of the fields in multipart/form-data is important. We require that all fields
	 * are provided _before_ the files. This allows us to set the storage location, and create
	 * the row in directus_files async during the upload of the actual file.
	 */

	let disk: string = toArray(env.STORAGE_LOCATIONS)[0];
	let payload: Partial<File> = {};
	let fileCount = 0;

	busboy.on('field', (fieldname: keyof File, val) => {
		if (fieldname === 'storage') {
			disk = val;
		}

		payload[fieldname] = val;
	});

	busboy.on('file', async (fieldname, fileStream, filename, encoding, mimetype) => {
		fileCount++;

		if (!payload.title) {
			payload.title = formatTitle(path.parse(filename).name);
		}

		if (req.accountability?.user) {
			payload.uploaded_by = req.accountability.user;
		}

		const payloadWithRequiredFields: Partial<File> & {
			filename_download: string;
			type: string;
			storage: string;
		} = {
			...payload,
			filename_download: filename,
			type: mimetype,
			storage: payload.storage || disk,
		};

		try {
			const primaryKey = await service.uploadOne(fileStream, payloadWithRequiredFields, existingPrimaryKey);
			savedFiles.push(primaryKey);
			tryDone();
		} catch (error) {
			busboy.emit('error', error);
		}
	});

	busboy.on('error', (error: Error) => {
		next(error);
	});

	busboy.on('finish', () => {
		tryDone();
	});

	req.pipe(busboy);

	function tryDone() {
		if (savedFiles.length === fileCount) {
			res.locals.savedFiles = savedFiles;
			return next();
		}
	}
});

router.post(
	'/',
	multipartHandler,
	asyncHandler(async (req, res, next) => {
		const service = new FilesService({
			accountability: req.accountability,
			schema: req.schema,
		});
		let keys: PrimaryKey | PrimaryKey[] = [];

		if (req.is('multipart/form-data')) {
			keys = res.locals.savedFiles;
		} else {
			keys = await service.createOne(req.body);
		}

		try {
			if (Array.isArray(keys) && keys.length > 1) {
				const records = await service.readMany(keys, req.sanitizedQuery);

				res.locals.payload = {
					data: records,
				};
			} else {
				const key = Array.isArray(keys) ? keys[0] : keys;
				const record = await service.readOne(key, req.sanitizedQuery);

				res.locals.payload = {
					data: record,
				};
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

const importSchema = Joi.object({
	url: Joi.string().required(),
	data: Joi.object(),
});

router.post(
	'/import',
	asyncHandler(async (req, res, next) => {
		const { error } = importSchema.validate(req.body);

		if (error) {
			throw new InvalidPayloadException(error.message);
		}

		const service = new FilesService({
			accountability: req.accountability,
			schema: req.schema,
		});

		const primaryKey = await service.importOne(req.body.url, req.body.data);

		try {
			const record = await service.readOne(primaryKey, req.sanitizedQuery);
			res.locals.payload = { data: record || null };
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
	const service = new FilesService({
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

	const meta = await metaService.getMetaForQuery('directus_files', req.sanitizedQuery);

	res.locals.payload = { data: result, meta };
	return next();
});

router.get('/', validateBatch('read'), readHandler, respond);
router.search('/', validateBatch('read'), readHandler, respond);

router.get(
	'/:pk',
	asyncHandler(async (req, res, next) => {
		const service = new FilesService({
			accountability: req.accountability,
			schema: req.schema,
		});

		const record = await service.readOne(req.params.pk, req.sanitizedQuery);
		res.locals.payload = { data: record || null };
		return next();
	}),
	respond
);

router.patch(
	'/',
	validateBatch('update'),
	asyncHandler(async (req, res, next) => {
		const service = new FilesService({
			accountability: req.accountability,
			schema: req.schema,
		});

		let keys: PrimaryKey[] = [];

		if (req.body.keys) {
			keys = await service.updateMany(req.body.keys, req.body.data);
		} else {
			keys = await service.updateByQuery(req.body.query, req.body.data);
		}

		try {
			const result = await service.readMany(keys, req.sanitizedQuery);
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

router.patch(
	'/:pk',
	multipartHandler,
	asyncHandler(async (req, res, next) => {
		const service = new FilesService({
			accountability: req.accountability,
			schema: req.schema,
		});

		await service.updateOne(req.params.pk, req.body);

		try {
			const record = await service.readOne(req.params.pk, req.sanitizedQuery);
			res.locals.payload = { data: record || null };
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
	'/',
	validateBatch('delete'),
	asyncHandler(async (req, res, next) => {
		const service = new FilesService({
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
	'/:pk',
	asyncHandler(async (req, res, next) => {
		const service = new FilesService({
			accountability: req.accountability,
			schema: req.schema,
		});

		await service.deleteOne(req.params.pk);

		return next();
	}),
	respond
);

export default router;
