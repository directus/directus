import { useEnv } from '@directus/env';
import {
	ContentTooLargeError,
	ForbiddenError,
	InvalidPayloadError,
	InvalidQueryError,
	UnsupportedMediaTypeError,
} from '@directus/errors';
import { toBoolean } from '@directus/utils';
import Busboy from 'busboy';
import bytes from 'bytes';
import { Router } from 'express';
import { z } from 'zod';
import { fromZodError } from 'zod-validation-error';
import { resolveLoginRedirect } from '../auth/utils/resolve-login-redirect.js';
import { clearSystemCache } from '../cache.js';
import { getDatabase } from '../database/index.js';
import { useLogger } from '../logger/index.js';
import collectionExists from '../middleware/collection-exists.js';
import readFileUploadBody from '../middleware/read-file-upload-body.js';
import { respond } from '../middleware/respond.js';
import { ExportService } from '../services/export.js';
import { getImportMaxFileSize, ImportService } from '../services/import/import.js';
import { RevisionsService } from '../services/revisions.js';
import { UtilsService } from '../services/utils.js';
import asyncHandler from '../utils/async-handler.js';
import { generateTranslations } from '../utils/generate-translations.js';
import { queryFlag } from '../utils/query-flag.js';
import { sanitizeQuery } from '../utils/sanitize-query.js';

const router = Router();

const env = useEnv();

const IMPORT_MAX_FILE_SIZE = bytes.parse(env['IMPORT_MAX_FILE_SIZE'] as string) ?? undefined;

const randomStringSchema = z.object({
	length: z.coerce.number().int().min(1).max(500).default(32),
});

router.get(
	'/random/string',
	asyncHandler(async (req, res) => {
		const { nanoid } = await import('nanoid');

		const { data: value, error } = randomStringSchema.safeParse(req.query);

		if (error) throw new InvalidQueryError({ reason: fromZodError(error).message });

		return res.json({ data: nanoid(value.length) });
	}),
);

const SortSchema = z
	.object({
		item: z.union([z.string(), z.number()]),
		to: z.union([z.string(), z.number()]),
	})
	.strict();

router.post(
	'/sort/:collection',
	collectionExists,
	asyncHandler(async (req, res) => {
		const { error } = SortSchema.safeParse(req.body);
		if (error) throw new InvalidPayloadError({ reason: fromZodError(error).message });

		const service = new UtilsService({
			accountability: req.accountability,
			schema: req.schema,
		});

		await service.sort(req.collection, req.body);

		return res.status(200).end();
	}),
);

router.post(
	'/revert/:revision',
	asyncHandler(async (req, _res, next) => {
		const service = new RevisionsService({
			accountability: req.accountability,
			schema: req.schema,
		});

		await service.revert(req.params['revision']!);
		next();
	}),
	respond,
);

router.post(
	'/import/:collection',
	collectionExists,
	asyncHandler(async (req, res, next) => {
		if (req.is('multipart/form-data') === false) {
			throw new UnsupportedMediaTypeError({ mediaType: req.headers['content-type']!, where: 'Content-Type header' });
		}

		const service = new ImportService({
			accountability: req.accountability,
			schema: req.schema,
		});

		let headers;

		if (req.headers['content-type']) {
			headers = req.headers;
		} else {
			headers = {
				...req.headers,
				'content-type': 'application/octet-stream',
			};
		}

		const maxFileSize = getImportMaxFileSize();

		const busboy = Busboy({
			headers,
			limits: {
				// A single file is imported per request; busboy ignores any extras.
				files: 1,
				// Cap the upload size (undefined = no cap). busboy rejects at exactly its fileSize, so +1
				// keeps the cap "exceeded": a file of exactly IMPORT_MAX_FILE_SIZE bytes is still allowed.
				fileSize: maxFileSize === undefined ? undefined : maxFileSize + 1,
			},
		});

		const background = toBoolean(req.query['background']);

		let fileReceived = false;
		let importSucceeded = false;
		let closed = false;
		let settled = false;

		// Dispatch the final response/error exactly once (busboy may emit `close` after an error).
		const finish = (fn: () => void) => {
			if (settled) return;
			settled = true;
			fn();
		};

		// Respond only once the body is fully consumed (busboy 'close') AND the import has settled, so the
		// response never precedes the upload being read.
		const tryRespond = () => {
			if (closed && !fileReceived) {
				return finish(() => next(new InvalidPayloadError({ reason: `No file was included in the body` })));
			}

			if (importSucceeded && closed) {
				return finish(() => res.status(200).end());
			}

			return undefined;
		};

		busboy.on('file', async (_fieldname, fileStream, { mimeType }) => {
			fileReceived = true;

			// Swallow stream errors at the controller level so a destroy() can't crash the process with an
			// unhandled 'error'. The importer attaches its own handlers and translates errors it observes.
			fileStream.on('error', () => {});

			// busboy enforces the size cap and can emit 'limit' before the importer starts reading. Respond
			// here directly (don't rely on the importer settling) and destroy the stream so the truncated
			// upload can't be committed.
			fileStream.on('limit', () => {
				fileStream.destroy(new ContentTooLargeError());
				finish(() => next(new ContentTooLargeError()));
			});

			try {
				await service.import(req.params['collection']!, mimeType, fileStream, { background });
				importSucceeded = true;
				tryRespond();
			} catch (err: any) {
				// import() can reject before reading the stream (e.g. bad media type); drain it so the client
				// gets the error rather than a reset connection.
				fileStream.resume();
				finish(() => next(err));
			}
		});

		busboy.on('error', (err: Error) => finish(() => next(err)));

		busboy.on('close', () => {
			closed = true;
			tryRespond();
		});

		req.pipe(busboy);
	}),
);

const ImportBatchSchema = z
	.array(
		z.object({
			collection: z.string(),
			items: z.array(z.record(z.string(), z.unknown())),
		}),
	)
	.min(1);

router.post(
	'/import',
	readFileUploadBody({ maxFileSize: IMPORT_MAX_FILE_SIZE }),
	asyncHandler(async (req, res, next) => {
		const { data: value, error } = ImportBatchSchema.safeParse(req.body);
		if (error) throw new InvalidPayloadError({ reason: fromZodError(error).message });

		if (req.query['mode'] !== undefined && ['add', 'merge'].includes(String(req.query['mode'])) === false) {
			throw new InvalidQueryError({ reason: `"mode" must be one of ["add", "merge"]` });
		}

		const mode = req.query['mode'] === 'merge' ? 'merge' : 'add';
		const dryRun = queryFlag(req.query['dryRun']);
		const dangerouslyAllowDelete = queryFlag(req.query['dangerouslyAllowDelete']);

		const service = new ImportService({
			accountability: req.accountability,
			schema: req.schema,
		});

		const result = await service.importBatch(value, { mode, dryRun, dangerouslyAllowDelete });

		res.locals['payload'] = { data: result };
		return next();
	}),
	respond,
);

router.post(
	'/export/:collection',
	collectionExists,
	asyncHandler(async (req, _res, next) => {
		if (!req.body.query) {
			throw new InvalidPayloadError({ reason: `"query" is required` });
		}

		if (!req.body.format) {
			throw new InvalidPayloadError({ reason: `"format" is required` });
		}

		const service = new ExportService({
			accountability: req.accountability,
			schema: req.schema,
		});

		const sanitizedQuery = await sanitizeQuery(req.body.query, req.schema, req.accountability ?? null);

		// We're not awaiting this, as it's supposed to run async in the background
		service.exportToFile(req.params['collection']!, sanitizedQuery, req.body.format, {
			file: req.body.file,
		});

		return next();
	}),
	respond,
);

router.post(
	'/translations/generate',
	asyncHandler(async (req, res, next) => {
		if (!req.accountability?.admin) throw new ForbiddenError();

		const result = await generateTranslations(req.body, {
			knex: getDatabase(),
			schema: req.schema,
			accountability: req.accountability,
		});

		try {
			await clearSystemCache({ forced: true });
		} catch (error) {
			useLogger().error(error, 'Failed to clear system cache after translation changes');
		}

		res.locals['payload'] = { data: result };
		return next();
	}),
	respond,
);

router.post(
	'/cache/clear',
	asyncHandler(async (req, res) => {
		const service = new UtilsService({
			accountability: req.accountability,
			schema: req.schema,
		});

		const clearSystemCache = 'system' in req.query && (req.query['system'] === '' || Boolean(req.query['system']));

		await service.clearCache({ system: clearSystemCache });

		res.status(200).end();
	}),
);

router.post(
	'/resolve-redirect',
	asyncHandler(async (req, res) => {
		if (!req.body?.redirect) {
			throw new InvalidPayloadError({ reason: `"redirect" is required` });
		}

		if (req.body?.provider && typeof req.body.provider !== 'string') {
			throw new InvalidPayloadError({ reason: `"provider" must be a string` });
		}

		try {
			const resolved = resolveLoginRedirect(req.body.redirect, {
				provider: req.body.provider,
			});

			return res.json({ data: resolved });
		} catch {
			throw new InvalidPayloadError({ reason: `Invalid "redirect" provided` });
		}
	}),
);

export default router;
