import express from 'express';
import asyncHandler from '../utils/async-handler';
import Busboy from 'busboy';
import { MetaService, FilesService } from '../services';
import { File, PrimaryKey } from '../types';
import formatTitle from '@directus/format-title';
import env from '../env';
import axios, { AxiosResponse } from 'axios';
import Joi from 'joi';
import {
	InvalidPayloadException,
	ForbiddenException,
	FailedValidationException,
	ServiceUnavailableException,
} from '../exceptions';
import url from 'url';
import path from 'path';
import useCollection from '../middleware/use-collection';
import { respond } from '../middleware/respond';
import { toArray } from '../utils/to-array';
import logger from '../logger';

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
			const primaryKey = await service.upload(fileStream, payloadWithRequiredFields, existingPrimaryKey);
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

		const service = new FilesService({
			accountability: req.accountability,
			schema: req.schema,
		});

		const fileCreatePermissions = req.schema.permissions.find(
			(permission) => permission.collection === 'directus_files' && permission.action === 'create'
		);

		if (!fileCreatePermissions) {
			throw new ForbiddenException();
		}

		let fileResponse: AxiosResponse<NodeJS.ReadableStream>;

		try {
			fileResponse = await axios.get<NodeJS.ReadableStream>(req.body.url, {
				responseType: 'stream',
			});
		} catch (err) {
			logger.warn(`Couldn't fetch file from url "${req.body.url}"`);
			logger.warn(err);
			throw new ServiceUnavailableException(`Couldn't fetch file from url "${req.body.url}"`, {
				service: 'external-file',
			});
		}

		const parsedURL = url.parse(fileResponse.request.res.responseUrl);
		const filename = path.basename(parsedURL.pathname as string);

		const payload = {
			filename_download: filename,
			storage: toArray(env.STORAGE_LOCATIONS)[0],
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
		const service = new FilesService({
			accountability: req.accountability,
			schema: req.schema,
		});
		const metaService = new MetaService({
			accountability: req.accountability,
			schema: req.schema,
		});

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
		const service = new FilesService({
			accountability: req.accountability,
			schema: req.schema,
		});
		const record = await service.readByKey(keys as any, req.sanitizedQuery);
		res.locals.payload = { data: record || null };
		return next();
	}),
	respond
);

router.patch(
	'/',
	asyncHandler(async (req, res, next) => {
		const service = new FilesService({
			accountability: req.accountability,
			schema: req.schema,
		});

		if (Array.isArray(req.body)) {
			const primaryKeys = await service.update(req.body);

			try {
				const result = await service.readByKey(primaryKeys, req.sanitizedQuery);
				res.locals.payload = { data: result || null };
			} catch (error) {
				if (error instanceof ForbiddenException) {
					return next();
				}

				throw error;
			}

			return next();
		}

		const updateSchema = Joi.object({
			keys: Joi.array().items(Joi.alternatives(Joi.string(), Joi.number())).required(),
			data: Joi.object().required().unknown(),
		});

		const { error } = updateSchema.validate(req.body);

		if (error) {
			throw new FailedValidationException(error.details[0]);
		}

		const primaryKeys = await service.update(req.body.data, req.body.keys);

		try {
			const result = await service.readByKey(primaryKeys, req.sanitizedQuery);
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
	'/',
	asyncHandler(async (req, res, next) => {
		if (!req.body || Array.isArray(req.body) === false) {
			throw new InvalidPayloadException(`Body has to be an array of primary keys`);
		}

		const service = new FilesService({
			accountability: req.accountability,
			schema: req.schema,
		});
		await service.delete(req.body as PrimaryKey[]);
		return next();
	}),
	respond
);

router.delete(
	'/:pk',
	asyncHandler(async (req, res, next) => {
		const keys = req.params.pk.includes(',') ? req.params.pk.split(',') : req.params.pk;
		const service = new FilesService({
			accountability: req.accountability,
			schema: req.schema,
		});
		await service.delete(keys as any);
		return next();
	}),
	respond
);

export default router;
