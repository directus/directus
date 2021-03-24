import { RequestHandler } from 'express';
import asyncHandler from '../utils/async-handler';
import env from '../env';
import { getCacheKey } from '../utils/get-cache-key';
import cache from '../cache';
import { Transform, transforms } from 'json2csv';
import { PassThrough } from 'stream';
import { ItemsService } from '../services';
import { UnprocessableEntityException } from '../exceptions';
import ms from 'ms';
import xliff from 'xliff';

export const respond: RequestHandler = asyncHandler(async (req, res) => {
	if (
		req.method.toLowerCase() === 'get' &&
		env.CACHE_ENABLED === true &&
		cache &&
		!req.sanitizedQuery.export &&
		res.locals.cache !== false
	) {
		const key = getCacheKey(req);
		await cache.set(key, res.locals.payload, ms(env.CACHE_TTL as string));
		await cache.set(`${key}__expires_at`, Date.now() + ms(env.CACHE_TTL as string));

		const noCacheRequested =
			req.headers['cache-control']?.includes('no-cache') || req.headers['Cache-Control']?.includes('no-cache');

		// Set cache-control header
		if (env.CACHE_AUTO_PURGE !== true && noCacheRequested === false) {
			const maxAge = `max-age=${ms(env.CACHE_TTL as string)}`;
			const access = !!req.accountability?.role === false ? 'public' : 'private';
			res.setHeader('Cache-Control', `${access}, ${maxAge}`);
		}

		if (noCacheRequested) {
			res.setHeader('Cache-Control', 'no-cache');
		}
	}

	if (req.sanitizedQuery.export) {
		let filename = '';

		if (req.collection) {
			filename += req.collection;
		} else {
			filename += 'Export';
		}

		filename += ' ' + getDateFormatted();

		if (req.sanitizedQuery.export === 'json') {
			res.attachment(`${filename}.json`);
			res.set('Content-Type', 'application/json');
			return res.status(200).send(JSON.stringify(res.locals.payload, null, '\t'));
		}

		if (req.sanitizedQuery.export === 'csv') {
			res.attachment(`${filename}.csv`);
			res.set('Content-Type', 'text/csv');
			const stream = new PassThrough();

			if (!res.locals.payload?.data || res.locals.payload.data.length === 0) {
				stream.end(Buffer.from(''));
				return stream.pipe(res);
			} else {
				stream.end(Buffer.from(JSON.stringify(res.locals.payload.data), 'utf-8'));
				const json2csv = new Transform({
					transforms: [transforms.flatten({ separator: '.' })],
				});
				return stream.pipe(json2csv).pipe(res);
			}
		}
		if (req.sanitizedQuery.export === 'xliff') {
			res.attachment(`${filename}.xliff`);
			res.set('Content-Type', 'text/xml');
			const language = req.sanitizedQuery.language;
			if (res.locals.payload?.data && res.locals.payload.data.length > 0) {
				const records = res.locals.payload.data;
				// TODO: is there is a better way to get translations relationship?
				const relation = req.schema.relations.find(
					(relation: any) => relation.one_collection === req.collection && relation.one_field === 'translations'
				);
				if (relation) {
					const translationsCollection = relation.many_collection;
					const translationsKeyField = relation.one_primary;
					const translationsFieldName = relation.one_field;
					const translationsIdFieldName = relation.many_primary;
					const tranlsationsExternalKey = relation.junction_field;
					const translationsParentField = relation.many_field;
					const translations = records.map((r: any) => {
						return {
							id: r[translationsKeyField],
							translationIds: r[translationsFieldName],
						};
					});
					const resources = {};
					const translationsIds = translations.reduce((acc: any[], val: any) => {
						return val.translationIds.length > 0 ? [...acc, ...val.translationIds] : acc;
					}, []);
					const itemsService = new ItemsService(translationsCollection, {
						accountability: req.accountability,
						schema: req.schema,
					});
					// making query to bring records for all found translations for current language
					const translationItems = await itemsService.readByQuery({
						filter: {
							[translationsIdFieldName]: { _in: translationsIds },
							[tranlsationsExternalKey]: { _eq: language },
						},
						limit: -1,
					});
					// obtaining values of translatable fields and putting them to the dictionary
					if (translationItems && translationItems.length > 0) {
						translationItems.forEach((item: any) => {
							const translation = translations.find((t: any) => t.translationIds.includes(item[translationsKeyField]));
							// removing system fields from output
							const { id, status, sort, user_created, date_created, user_updated, date_updated, ...rest } = item;
							// ensuring that key field was removed
							delete rest[translationsKeyField];
							delete rest[tranlsationsExternalKey];
							delete rest[translationsParentField];
							Object.keys(rest).forEach((key) => {
								(resources as any)[`${translation.id}.${key}`] = {
									source: rest[key],
								};
							});
						});
					}
					const json = {
						resources: {
							[req.collection]: resources,
						},
						sourceLanguage: language,
					};
					const output = await xliff.jsToXliff12(json);
					return res.status(200).send(output);
				} else {
					throw new UnprocessableEntityException(`Information about translations cannot be found.`);
				}
			}
		}
	}

	if (Buffer.isBuffer(res.locals.payload)) {
		return res.end(res.locals.payload);
	} else {
		return res.json(res.locals.payload);
	}
});

function getDateFormatted() {
	const date = new Date();

	let month = String(date.getMonth() + 1);
	if (month.length === 1) month = '0' + month;

	let day = String(date.getDate());
	if (day.length === 1) day = '0' + day;

	return `${date.getFullYear()}-${month}-${day} at ${date.getHours()}.${date.getMinutes()}.${date.getSeconds()}`;
}
