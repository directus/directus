import formatTitle from '@directus/format-title';
import { toArray, getFieldsFromTemplate } from '@directus/utils';
import Busboy from 'busboy';
import bytes from 'bytes';
import type { RequestHandler } from 'express';
import express from 'express';
import Joi from 'joi';
import { minimatch } from 'minimatch';
import path from 'path';
import env from '../env.js';
import { ContentTooLargeException } from '../exceptions/content-too-large.js';
import { ForbiddenException, InvalidPayloadException, ServiceUnavailableException } from '../exceptions/index.js';
import { respond } from '../middleware/respond.js';
import useCollection from '../middleware/use-collection.js';
import { validateBatch } from '../middleware/validate-batch.js';
import { FilesService } from '../services/files.js';
import { MailService } from '../services/mail/index.js';
import { MetaService } from '../services/meta.js';
import type { PrimaryKey } from '../types/index.js';
import asyncHandler from '../utils/async-handler.js';
import { sanitizeQuery } from '../utils/sanitize-query.js';
import { render } from 'micromustache';
import { getStorage } from '../storage/index.js';

const router = express.Router();

router.use(useCollection('directus_files'));

export const multipartHandler: RequestHandler = (req, res, next) => {
	if (req.is('multipart/form-data') === false) return next();

	let headers;

	if (req.headers['content-type']) {
		headers = req.headers;
	} else {
		headers = {
			...req.headers,
			'content-type': 'application/octet-stream',
		};
	}

	const busboy = Busboy({
		headers,
		defParamCharset: 'utf8',
		limits: {
			fileSize: env['FILES_MAX_UPLOAD_SIZE'] ? bytes(env['FILES_MAX_UPLOAD_SIZE'] as string) : undefined,
		},
	});

	const savedFiles: PrimaryKey[] = [];
	const service = new FilesService({ accountability: req.accountability, schema: req.schema });

	const existingPrimaryKey = req.params['pk'] || undefined;

	/**
	 * The order of the fields in multipart/form-data is important. We require that all fields
	 * are provided _before_ the files. This allows us to set the storage location, and create
	 * the row in directus_files async during the upload of the actual file.
	 */

	let disk: string = toArray(env['STORAGE_LOCATIONS'])[0];
	let payload: any = {};
	let fileCount = 0;

	busboy.on('field', (fieldname, val) => {
		let fieldValue: string | null | boolean = val;

		if (typeof fieldValue === 'string' && fieldValue.trim() === 'null') fieldValue = null;
		if (typeof fieldValue === 'string' && fieldValue.trim() === 'false') fieldValue = false;
		if (typeof fieldValue === 'string' && fieldValue.trim() === 'true') fieldValue = true;

		if (fieldname === 'storage') {
			disk = val;
		}

		payload[fieldname] = fieldValue;
	});

	busboy.on('file', async (_fieldname, fileStream, { filename, mimeType }) => {
		if (!filename) {
			return busboy.emit('error', new InvalidPayloadException(`File is missing filename`));
		}

		const allowedPatterns = toArray(env['FILES_MIME_TYPE_ALLOW_LIST'] as string | string[]);
		const mimeTypeAllowed = allowedPatterns.some((pattern) => minimatch(mimeType, pattern));

		if (mimeTypeAllowed === false) {
			return busboy.emit('error', new InvalidPayloadException(`File is of invalid content type`));
		}

		fileCount++;

		if (!existingPrimaryKey) {
			if (!payload.title) {
				payload.title = formatTitle(path.parse(filename).name);
			}

			payload.filename_download = filename;
		}

		const payloadWithRequiredFields = {
			...payload,
			type: mimeType,
			storage: payload.storage || disk,
		};

		// Clear the payload for the next to-be-uploaded file
		payload = {};

		fileStream.on('limit', () => {
			const error = new ContentTooLargeException(`Uploaded file is too large`);
			next(error);
		});

		try {
			const primaryKey = await service.uploadOne(fileStream, payloadWithRequiredFields, existingPrimaryKey);
			savedFiles.push(primaryKey);
			tryDone();
		} catch (error: any) {
			busboy.emit('error', error);
		}

		return undefined;
	});

	busboy.on('error', (error: Error) => {
		next(error);
	});

	busboy.on('close', () => {
		tryDone();
	});

	req.pipe(busboy);

	function tryDone() {
		if (savedFiles.length === fileCount) {
			if (fileCount === 0) {
				return next(new InvalidPayloadException(`No files were included in the body`));
			}

			res.locals['savedFiles'] = savedFiles;
			return next();
		}
	}
};

router.post(
	'/',
	asyncHandler(multipartHandler),
	asyncHandler(async (req, res, next) => {
		const service = new FilesService({
			accountability: req.accountability,
			schema: req.schema,
		});

		let keys: PrimaryKey | PrimaryKey[] = [];

		if (req.is('multipart/form-data')) {
			keys = res.locals['savedFiles'];
		} else {
			keys = await service.createOne(req.body);
		}

		try {
			if (Array.isArray(keys) && keys.length > 1) {
				const records = await service.readMany(keys, req.sanitizedQuery);

				res.locals['payload'] = {
					data: records,
				};
			} else {
				const key = Array.isArray(keys) ? keys[0]! : keys;
				const record = await service.readOne(key, req.sanitizedQuery);

				res.locals['payload'] = {
					data: record,
				};
			}
		} catch (error: any) {
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
			res.locals['payload'] = { data: record || null };
		} catch (error: any) {
			if (error instanceof ForbiddenException) {
				return next();
			}

			throw error;
		}

		return next();
	}),
	respond
);

const sendSchema = Joi.object({
	emails: Joi.array().items(Joi.string().email()).required(),
	subject: Joi.string().allow('').allow(null),
	body: Joi.string().allow('').allow(null),
	key: Joi.string().uuid().required(),
});

router.post(
	'/send',
	asyncHandler(async (req, res, _next) => {
		const { error } = sendSchema.validate(req.body);
		if (error) {
			throw new InvalidPayloadException(error.message);
		}

		// Obtain the required fields from the template strings
		const fields: Set<string> = new Set(
			getFieldsFromTemplate(req.body.body).concat(getFieldsFromTemplate(req.body.subject))
		);
		fields.add('id');
		fields.add('title');
		fields.add('filename_download');
		fields.add('filename_disk');
		fields.add('storage');
		const filesService = new FilesService({
			accountability: req.accountability,
			schema: req.schema,
		});
		const values: Record<string, any> = await filesService.readOne(req.body.key, {
			fields: Array.from(fields),
		}, { emitEvents: false });
		// Use micromustache to render the template strings
		const subject = req.body.subject ? render(req.body.subject, values) : '';
		const body = req.body.body ? render(req.body.body, values) : '';
		// logger.info(`Sending email to ${req.body.emails.join(', ')}`);
		// logger.info(`Subject: ${subject}`);
		// logger.info(`Body: ${body}`);

		// Check if the file exists
		const storage = await getStorage();
		const exists = await storage.location(values['storage']).exists(values['filename_disk']);
		if (!exists) {
			throw new InvalidPayloadException(`File does not exist`);
		}
		const fileStream = await storage.location(values['storage']).read(values['filename_disk']);

		const mailService = new MailService({
			accountability: req.accountability,
			schema: req.schema,
		});
		try {
			const result: any = await mailService.send({
				to: req.body.emails,
				subject,
				text: body,
				attachments: [{
					filename: values['filename_download'],
					content: fileStream,
				}]
			});
			res.json({
				success: true,
				accepted: result.accepted?.length ?? 0,
				rejected: result.rejected?.length ?? (req.body.emails.length - (result.accepted?.length ?? 0)),
			});
		} catch (error: any) {
			throw new ServiceUnavailableException('Error sending email', { service: 'files', error });
		}
	})
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

	res.locals['payload'] = { data: result, meta };
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

		const record = await service.readOne(req.params['pk']!, req.sanitizedQuery);
		res.locals['payload'] = { data: record || null };
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

		if (Array.isArray(req.body)) {
			keys = await service.updateBatch(req.body);
		} else if (req.body.keys) {
			keys = await service.updateMany(req.body.keys, req.body.data);
		} else {
			const sanitizedQuery = sanitizeQuery(req.body.query, req.accountability);
			keys = await service.updateByQuery(sanitizedQuery, req.body.data);
		}

		try {
			const result = await service.readMany(keys, req.sanitizedQuery);
			res.locals['payload'] = { data: result || null };
		} catch (error: any) {
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
	asyncHandler(multipartHandler),
	asyncHandler(async (req, res, next) => {
		const service = new FilesService({
			accountability: req.accountability,
			schema: req.schema,
		});

		await service.updateOne(req.params['pk']!, req.body);

		try {
			const record = await service.readOne(req.params['pk']!, req.sanitizedQuery);
			res.locals['payload'] = { data: record || null };
		} catch (error: any) {
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
	asyncHandler(async (req, _res, next) => {
		const service = new FilesService({
			accountability: req.accountability,
			schema: req.schema,
		});

		if (Array.isArray(req.body)) {
			await service.deleteMany(req.body);
		} else if (req.body.keys) {
			await service.deleteMany(req.body.keys);
		} else {
			const sanitizedQuery = sanitizeQuery(req.body.query, req.accountability);
			await service.deleteByQuery(sanitizedQuery);
		}

		return next();
	}),
	respond
);

router.delete(
	'/:pk',
	asyncHandler(async (req, _res, next) => {
		const service = new FilesService({
			accountability: req.accountability,
			schema: req.schema,
		});

		await service.deleteOne(req.params['pk']!);

		return next();
	}),
	respond
);

export default router;
