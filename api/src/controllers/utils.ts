import { ForbiddenError, InvalidPayloadError, InvalidQueryError, UnsupportedMediaTypeError } from '@directus/errors';
import type { GlobalSearchCollectionConfig } from '@directus/types';
import { getFieldsFromTemplate, mergeFilters, toBoolean } from '@directus/utils';
import argon2 from 'argon2';
import Busboy from 'busboy';
import { Router } from 'express';
import Joi from 'joi';
import { resolveLoginRedirect } from '../auth/utils/resolve-login-redirect.js';
import { clearSystemCache } from '../cache.js';
import { getDatabase } from '../database/index.js';
import { useLogger } from '../logger/index.js';
import collectionExists from '../middleware/collection-exists.js';
import { respond } from '../middleware/respond.js';
import { CollectionsService } from '../services/collections.js';
import { ExportService, ImportService } from '../services/import-export.js';
import { ItemsService } from '../services/items.js';
import { RevisionsService } from '../services/revisions.js';
import { SettingsService } from '../services/settings.js';
import { UtilsService } from '../services/utils.js';
import asyncHandler from '../utils/async-handler.js';
import { createDeepObject } from '../utils/create-deep-object.js';
import { generateHash } from '../utils/generate-hash.js';
import { generateTranslations } from '../utils/generate-translations.js';
import { sanitizeQuery } from '../utils/sanitize-query.js';

const router = Router();

const randomStringSchema = Joi.object<{ length: number }>({
	length: Joi.number().integer().min(1).max(500).default(32),
});

router.get(
	'/random/string',
	asyncHandler(async (req, res) => {
		const { nanoid } = await import('nanoid');

		const { error, value } = randomStringSchema.validate(req.query, { allowUnknown: true });

		if (error) throw new InvalidQueryError({ reason: error.message });

		return res.json({ data: nanoid(value.length) });
	}),
);

router.post(
	'/hash/generate',
	asyncHandler(async (req, res) => {
		if (!req.body?.string) {
			throw new InvalidPayloadError({ reason: `"string" is required` });
		}

		const hash = await generateHash(req.body.string);

		return res.json({ data: hash });
	}),
);

router.post(
	'/hash/verify',
	asyncHandler(async (req, res) => {
		if (!req.body?.string) {
			throw new InvalidPayloadError({ reason: `"string" is required` });
		}

		if (!req.body?.hash) {
			throw new InvalidPayloadError({ reason: `"hash" is required` });
		}

		try {
			const result = await argon2.verify(req.body.hash, req.body.string);
			return res.json({ data: result });
		} catch {
			throw new InvalidPayloadError({ reason: `Invalid "hash" or "string"` });
		}
	}),
);

const SortSchema = Joi.object({
	item: Joi.alternatives(Joi.string(), Joi.number()).required(),
	to: Joi.alternatives(Joi.string(), Joi.number()).required(),
});

router.post(
	'/sort/:collection',
	collectionExists,
	asyncHandler(async (req, res) => {
		const { error } = SortSchema.validate(req.body);
		if (error) throw new InvalidPayloadError({ reason: error.message });

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

		const busboy = Busboy({ headers });

		busboy.on('file', async (_fieldname, fileStream, { mimeType }) => {
			try {
				await service.import(req.params['collection']!, mimeType, fileStream, {
					background: toBoolean(req.query['background']),
				});
			} catch (err: any) {
				return next(err);
			}

			return res.status(200).end();
		});

		busboy.on('error', (err: Error) => next(err));

		req.pipe(busboy);
	}),
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

const MAX_SEARCH_COLLECTIONS = 20;

router.post(
	'/search',
	asyncHandler(async (req, res) => {
		const { query } = req.body;

		if (!query || typeof query !== 'string') {
			throw new InvalidPayloadError({ reason: `"query" is required and must be a string` });
		}

		const settingsService = new SettingsService({ schema: req.schema });
		const settings = await settingsService.readSingleton({});
		const config = settings['global_search_config'] as GlobalSearchCollectionConfig[] | null;

		if (!config?.length) {
			return res.json({ data: {} });
		}

		const collections = config.slice(0, MAX_SEARCH_COLLECTIONS);
		const collectionsService = new CollectionsService({ accountability: req.accountability, schema: req.schema });
		const collectionMeta = await collectionsService.readByQuery();
		const collectionMetaByName = new Map(collectionMeta.map((collection) => [collection.collection, collection.meta]));

		const results: Record<string, any[]> = {};

		await Promise.allSettled(
			collections.map(async (collectionConfig) => {
				try {
					const service = new ItemsService(collectionConfig.collection, {
						accountability: req.accountability,
						schema: req.schema,
					});

					const searchFilter = {
						_or: collectionConfig.fields.map((field) => createDeepObject(field, { _icontains: query })),
					};

					const filter = collectionConfig.filter ? mergeFilters(collectionConfig.filter, searchFilter) : searchFilter;

					const displayTemplate =
						collectionConfig.display_template ??
						collectionMetaByName.get(collectionConfig.collection)?.display_template ??
						null;

					const templateFields = displayTemplate ? getFieldsFromTemplate(displayTemplate) : [];

					const primaryKeyField = req.schema.collections[collectionConfig.collection]?.primary;
					const fieldsToFetch = [
						...(primaryKeyField ? [primaryKeyField] : []),
						...templateFields,
						...collectionConfig.fields,
						...(collectionConfig.description_field ? [collectionConfig.description_field] : []),
					];

					const items = await service.readByQuery({
						filter,
						fields: [...new Set(fieldsToFetch)],
						limit: collectionConfig.limit ?? 5,
						sort: collectionConfig.sort ? [collectionConfig.sort] : null,
					});

					results[collectionConfig.collection] = items;
				} catch {
					// Skip collections the user can't access
				}
			}),
		);

		return res.json({ data: results });
	}),
);

export default router;
