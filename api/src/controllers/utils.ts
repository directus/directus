import { ForbiddenError, InvalidPayloadError, InvalidQueryError, UnsupportedMediaTypeError } from '@directus/errors';
import type { Accountability, FieldOverview, GlobalSearchConfig, SchemaOverview, Type } from '@directus/types';
import { getFieldsFromTemplate, getRelationInfo, mergeFilters, toBoolean } from '@directus/utils';
import argon2 from 'argon2';
import Busboy from 'busboy';
import { Router } from 'express';
import Joi from 'joi';
import pLimit from 'p-limit';
import { resolveLoginRedirect } from '../auth/utils/resolve-login-redirect.js';
import { clearSystemCache } from '../cache.js';
import { getDatabase } from '../database/index.js';
import { useLogger } from '../logger/index.js';
import collectionExists from '../middleware/collection-exists.js';
import { respond } from '../middleware/respond.js';
import { fetchAllowedFields } from '../permissions/modules/fetch-allowed-fields/fetch-allowed-fields.js';
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
import { isValidUuid } from '../utils/is-valid-uuid.js';
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
const MAX_SEARCH_CONCURRENCY = 5;
const DEFAULT_SEARCH_LIMIT = 5;
const MAX_SEARCH_LIMIT = 25;
const SLOW_GLOBAL_SEARCH_THRESHOLD_MS = 1_000;
const TEXT_SEARCH_FIELD_TYPES = new Set<Type>(['string', 'text', 'csv']);
const DECIMAL_SEARCH_FIELD_TYPES = new Set<Type>(['decimal', 'float']);
const EXACT_SEARCH_FIELD_TYPES = new Set<Type>(['hash']);

type ResolvedFieldPath = {
	field: FieldOverview;
	segments: { collection: string; field: string }[];
};

type GlobalSearchCollectionTiming = {
	collection: string;
	durationMs: number;
};

function normalizeSearchLimit(limit: number | null | undefined) {
	if (typeof limit !== 'number' || !Number.isInteger(limit) || limit <= 0) {
		return DEFAULT_SEARCH_LIMIT;
	}

	return Math.min(limit, MAX_SEARCH_LIMIT);
}

function getSortFieldPath(sort: string | null | undefined) {
	return sort?.startsWith('-') ? sort.slice(1) : sort;
}

function getSearchFilterForField(path: string, type: Type, query: string) {
	if (TEXT_SEARCH_FIELD_TYPES.has(type)) {
		return createDeepObject(path, { _icontains: query });
	}

	const normalizedQuery = query.trim();
	if (normalizedQuery.length === 0) return null;

	if (type === 'integer') {
		if (/^-?\d+$/.test(normalizedQuery) === false) return null;
		const number = Number(normalizedQuery);
		if (Number.isSafeInteger(number) === false) return null;
		return createDeepObject(path, { _eq: number });
	}

	if (type === 'bigInteger') {
		if (/^-?\d+$/.test(normalizedQuery) === false) return null;
		return createDeepObject(path, { _eq: normalizedQuery });
	}

	if (DECIMAL_SEARCH_FIELD_TYPES.has(type)) {
		if (/^-?(?:\d+|\d*\.\d+)$/.test(normalizedQuery) === false) return null;
		const number = Number(normalizedQuery);
		if (!Number.isFinite(number)) return null;
		return createDeepObject(path, { _eq: number });
	}

	if (type === 'boolean') {
		const normalizedBooleanQuery = normalizedQuery.toLowerCase();

		if (['true', '1', 'yes'].includes(normalizedBooleanQuery)) {
			return createDeepObject(path, { _eq: true });
		}

		if (['false', '0', 'no'].includes(normalizedBooleanQuery)) {
			return createDeepObject(path, { _eq: false });
		}

		return null;
	}

	if (type === 'uuid') {
		if (!isValidUuid(normalizedQuery)) return null;
		return createDeepObject(path, { _eq: normalizedQuery });
	}

	if (EXACT_SEARCH_FIELD_TYPES.has(type)) {
		return createDeepObject(path, { _eq: normalizedQuery });
	}

	return null;
}

function resolveFieldPath(schema: SchemaOverview, collection: string, path: string): ResolvedFieldPath | null {
	let currentCollection = collection;
	const segments: ResolvedFieldPath['segments'] = [];
	const parts = path.split('.');

	for (const [index, part] of parts.entries()) {
		if (!part) return null;

		const [fieldName, collectionScope] = part.split(':');
		if (!fieldName) return null;

		const collectionInfo = schema.collections[currentCollection];
		const field = collectionInfo?.fields[fieldName];
		if (!field) return null;

		segments.push({ collection: currentCollection, field: fieldName });

		if (index === parts.length - 1) {
			return { field, segments };
		}

		const { relation, relationType } = getRelationInfo(schema.relations, currentCollection, fieldName);

		if (!relation) return null;

		if (relationType === 'a2o') {
			if (!collectionScope) return null;
			currentCollection = collectionScope;
		} else if (relationType === 'm2o') {
			if (!relation.related_collection) return null;
			currentCollection = relation.related_collection;
		} else {
			currentCollection = relation.collection;
		}
	}

	return null;
}

function createFieldAccessChecker(accountability: Accountability | undefined, schema: SchemaOverview) {
	const allowedFieldsByCollection = new Map<string, Promise<Set<string> | null>>();

	async function getAllowedFields(collection: string) {
		if (!accountability || accountability.admin === true) {
			return null;
		}

		if (!allowedFieldsByCollection.has(collection)) {
			allowedFieldsByCollection.set(
				collection,
				fetchAllowedFields({ collection, action: 'read', accountability }, { schema, knex: getDatabase() }).then(
					(fields) => (fields.includes('*') ? null : new Set(fields)),
				),
			);
		}

		return allowedFieldsByCollection.get(collection)!;
	}

	return async function canReadFieldPath(collection: string, path: string) {
		const resolved = resolveFieldPath(schema, collection, path);
		if (!resolved) return false;

		for (const segment of resolved.segments) {
			const allowedFields = await getAllowedFields(segment.collection);

			if (allowedFields && !allowedFields.has(segment.field)) {
				return false;
			}
		}

		return true;
	};
}

function logSlowGlobalSearchRequest(
	durationMs: number,
	configuredCollections: string[],
	results: Record<string, any[]>,
	collectionTimings: GlobalSearchCollectionTiming[],
) {
	if (durationMs < SLOW_GLOBAL_SEARCH_THRESHOLD_MS) return;

	const slowestCollection = collectionTimings.reduce<GlobalSearchCollectionTiming | null>((slowest, timing) => {
		if (!slowest || timing.durationMs > slowest.durationMs) return timing;
		return slowest;
	}, null);

	useLogger().warn(
		{
			durationMs: Math.round(durationMs),
			thresholdMs: SLOW_GLOBAL_SEARCH_THRESHOLD_MS,
			configuredCollections,
			resultCounts: Object.fromEntries(
				Object.entries(results).map(([collection, items]) => [collection, items.length]),
			),
			slowestCollection: slowestCollection
				? {
						collection: slowestCollection.collection,
						durationMs: Math.round(slowestCollection.durationMs),
					}
				: null,
		},
		'Slow global search request',
	);
}

const globalSearchHandler = asyncHandler(async (req, res) => {
	if (!req.accountability?.user || !req.accountability.app) {
		throw new ForbiddenError();
	}

	const { query } = req.body;

	if (typeof query !== 'string') {
		throw new InvalidPayloadError({ reason: `"query" is required and must be a string` });
	}

	const searchQuery = query.trim();

	if (searchQuery.length < 2) {
		return res.json({ data: {} });
	}

	const startedAt = performance.now();
	const settingsService = new SettingsService({ schema: req.schema });
	const settings = await settingsService.readSingleton({});
	const config = settings['global_search_config'] as GlobalSearchConfig | null;
	const collections = Array.isArray(config?.collections) ? config.collections.slice(0, MAX_SEARCH_COLLECTIONS) : [];

	if (collections.length === 0) {
		logSlowGlobalSearchRequest(performance.now() - startedAt, [], {}, []);
		return res.json({ data: {} });
	}

	const collectionsService = new CollectionsService({ accountability: req.accountability, schema: req.schema });
	const collectionMeta = await collectionsService.readByQuery();
	const collectionMetaByName = new Map(collectionMeta.map((collection) => [collection.collection, collection.meta]));
	const canReadFieldPath = createFieldAccessChecker(req.accountability, req.schema);

	const results: Record<string, any[]> = {};
	const collectionTimings: GlobalSearchCollectionTiming[] = [];

	const limit = pLimit(MAX_SEARCH_CONCURRENCY);

	await Promise.allSettled(
		collections.map((collectionConfig) =>
			limit(async () => {
				try {
					if (!collectionConfig.fields?.length) return;
					if (!req.schema.collections[collectionConfig.collection]) return;

					const searchFilters: Record<string, any>[] = [];

					for (const field of collectionConfig.fields) {
						const resolvedField = resolveFieldPath(req.schema, collectionConfig.collection, field);
						if (!resolvedField) continue;

						if ((await canReadFieldPath(collectionConfig.collection, field)) === false) continue;

						const searchFilterForField = getSearchFilterForField(field, resolvedField.field.type, searchQuery);
						if (searchFilterForField) searchFilters.push(searchFilterForField);
					}

					if (searchFilters.length === 0) return;

					const service = new ItemsService(collectionConfig.collection, {
						accountability: req.accountability,
						schema: req.schema,
					});

					const searchFilter = {
						_or: searchFilters,
					};

					const filter = collectionConfig.filter ? mergeFilters(collectionConfig.filter, searchFilter) : searchFilter;

					const displayTemplate =
						collectionConfig.displayTemplate ??
						collectionMetaByName.get(collectionConfig.collection)?.display_template ??
						null;

					const templateFields = displayTemplate ? getFieldsFromTemplate(displayTemplate) : [];

					const primaryKeyField = req.schema.collections[collectionConfig.collection]?.primary;

					const fieldsToFetch = [
						...(primaryKeyField ? [primaryKeyField] : []),
						...templateFields,
						...(collectionConfig.descriptionField ? [collectionConfig.descriptionField] : []),
					];

					const readableFieldsToFetch: string[] = [];

					for (const field of fieldsToFetch) {
						if (await canReadFieldPath(collectionConfig.collection, field)) {
							readableFieldsToFetch.push(field);
						}
					}

					if (primaryKeyField && !readableFieldsToFetch.includes(primaryKeyField)) return;

					const sortField = getSortFieldPath(collectionConfig.sort);
					const canSort = sortField ? await canReadFieldPath(collectionConfig.collection, sortField) : false;
					const sort = canSort && collectionConfig.sort ? [collectionConfig.sort] : null;
					const collectionStartedAt = performance.now();

					const items = await service.readByQuery({
						filter,
						fields: [...new Set(readableFieldsToFetch)],
						limit: normalizeSearchLimit(collectionConfig.limit),
						sort,
					});

					collectionTimings.push({
						collection: collectionConfig.collection,
						durationMs: performance.now() - collectionStartedAt,
					});

					results[collectionConfig.collection] = items;
				} catch (error) {
					// A collection the user can't read throws here and is expected — skip it. Anything
					// else (bad config filter, query error) is worth surfacing for debugging since the
					// collection silently drops out of the results otherwise.
					useLogger().debug(error, `Global search skipped collection "${collectionConfig.collection}"`);
				}
			}),
		),
	);

	logSlowGlobalSearchRequest(
		performance.now() - startedAt,
		collections.map((collection) => collection.collection),
		results,
		collectionTimings,
	);

	return res.json({ data: results });
});

router.post('/global-search', globalSearchHandler);

export default router;
