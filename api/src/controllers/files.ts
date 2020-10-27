import express from 'express';
import asyncHandler from 'express-async-handler';
import Busboy from 'busboy';
import { MetaService, FilesService } from '../services';
import { File, PrimaryKey } from '../types';
import formatTitle from '@directus/format-title';
import env from '../env';
import axios from 'axios';
import Joi from 'joi';
import { InvalidPayloadException, ForbiddenException } from '../exceptions';
import url from 'url';
import path from 'path';
import useCollection from '../middleware/use-collection';
import { respond } from '../middleware/respond';

const router = express.Router();

router.use(useCollection('directus_files'));

const multipartHandler = asyncHandler(async (req, res, next) => {
	if (req.is('multipart/form-data') === false) return next();

	const busboy = new Busboy({ headers: req.headers });
	const savedFiles: PrimaryKey[] = [];
	const service = new FilesService({ accountability: req.accountability });

	const existingPrimaryKey = req.params.pk || undefined;

	/**
	 * The order of the fields in multipart/form-data is important. We require that all fields
	 * are provided _before_ the files. This allows us to set the storage location, and create
	 * the row in directus_files async during the upload of the actual file.
	 */

	let disk: string = (env.STORAGE_LOCATIONS as string).split(',')[0].trim();
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
			const primaryKey = await service.upload(
				fileStream,
				payloadWithRequiredFields,
				existingPrimaryKey
			);
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
		const service = new FilesService({ accountability: req.accountability });
		let keys: PrimaryKey | PrimaryKey[] = [];

		if (req.is('multipart/form-data')) {
			keys = res.locals.savedFiles;
		} else {
			// @TODO is this ever used in real life? Wouldn't you always upload a file on create?
			keys = await service.create(req.body);
		}

		try {
			const record = await service.readByKey(keys as any, req.sanitizedQuery);

			res.locals.payload = {
				data: record,
			};
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

		const service = new FilesService({ accountability: req.accountability });

		const fileResponse = await axios.get<NodeJS.ReadableStream>(req.body.url, {
			responseType: 'stream',
		});

		const parsedURL = url.parse(fileResponse.request.res.responseUrl);
		const filename = path.basename(parsedURL.pathname as string);

		const payload = {
			filename_download: filename,
			storage: (env.STORAGE_LOCATIONS as string).split(',')[0].trim(),
			type: fileResponse.headers['content-type'],
			title: formatTitle(filename),
			...(req.body.data || {}),
		};

		const primaryKey = await service.upload(fileResponse.data, payload);

		try {
			const record = await service.readByKey(primaryKey, req.sanitizedQuery);
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

router.get(
	'/',
	asyncHandler(async (req, res, next) => {
		const service = new FilesService({ accountability: req.accountability });
		const metaService = new MetaService({ accountability: req.accountability });

		const records = await service.readByQuery(req.sanitizedQuery);
		const meta = await metaService.getMetaForQuery('directus_files', req.sanitizedQuery);

		res.locals.payload = { data: records || null, meta };
		return next();
	}),
	respond
);

router.get(
	'/:pk',
	asyncHandler(async (req, res, next) => {
		const keys = req.params.pk.includes(',') ? req.params.pk.split(',') : req.params.pk;
		const service = new FilesService({ accountability: req.accountability });
		const record = await service.readByKey(keys as any, req.sanitizedQuery);
		res.locals.payload = { data: record || null };
		return next();
	}),
	respond
);

router.patch(
	'/:pk',
	multipartHandler,
	asyncHandler(async (req, res, next) => {
		const service = new FilesService({ accountability: req.accountability });
		let keys: PrimaryKey | PrimaryKey[] = [];

		if (req.is('multipart/form-data')) {
			keys = res.locals.savedFiles;
		} else {
			keys = req.params.pk.includes(',') ? req.params.pk.split(',') : req.params.pk;
			await service.update(req.body, keys as any);
		}

		try {
			const record = await service.readByKey(keys as any, req.sanitizedQuery);
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
	'/:pk',
	asyncHandler(async (req, res, next) => {
		const keys = req.params.pk.includes(',') ? req.params.pk.split(',') : req.params.pk;
		const service = new FilesService({ accountability: req.accountability });
		await service.delete(keys as any);
		return next();
	}),
	respond
);

export default router;
