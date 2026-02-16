import { useEnv } from '@directus/env';
import { InvalidQueryError } from '@directus/errors';
import type { Accountability, Aggregate, Query, SchemaOverview } from '@directus/types';
import { parseFilter, parseJSON } from '@directus/utils';
import { flatten, get, isPlainObject, merge, set } from 'lodash-es';
import getDatabase from '../database/index.js';
import { useLogger } from '../logger/index.js';
import { fetchPolicies } from '../permissions/lib/fetch-policies.js';
import { contextHasDynamicVariables } from '../permissions/modules/process-ast/utils/context-has-dynamic-variables.js';
import type { Context } from '../permissions/types.js';
import { extractRequiredDynamicVariableContext } from '../permissions/utils/extract-required-dynamic-variable-context.js';
import { fetchDynamicVariableData } from '../permissions/utils/fetch-dynamic-variable-data.js';
import { Meta } from '../types/index.js';

/**
 * Sanitize the query parameters and parse them where necessary.
 */
export async function sanitizeQuery(
	rawQuery: Record<string, any>,
	schema: SchemaOverview,
	accountability?: Accountability | null,
): Promise<Query> {
	const env = useEnv();

	const query: Query = {};

	const hasMaxLimit =
		'QUERY_LIMIT_MAX' in env &&
		Number(env['QUERY_LIMIT_MAX']) >= 0 &&
		!Number.isNaN(Number(env['QUERY_LIMIT_MAX'])) &&
		Number.isFinite(Number(env['QUERY_LIMIT_MAX']));

	if (rawQuery['limit'] !== undefined) {
		const limit = sanitizeLimit(rawQuery['limit']);

		if (typeof limit === 'number') {
			query.limit = limit === -1 && hasMaxLimit ? Number(env['QUERY_LIMIT_MAX']) : limit;
		}
	} else if (hasMaxLimit) {
		query.limit = Math.min(Number(env['QUERY_LIMIT_DEFAULT']), Number(env['QUERY_LIMIT_MAX']));
	}

	if (rawQuery['fields']) {
		query.fields = sanitizeFields(rawQuery['fields']);
	}

	if (rawQuery['groupBy']) {
		query.group = sanitizeFields(rawQuery['groupBy']);
	}

	if (rawQuery['aggregate']) {
		query.aggregate = sanitizeAggregate(rawQuery['aggregate']);
	}

	if (rawQuery['sort']) {
		query.sort = sanitizeSort(rawQuery['sort']);
	}

	if (rawQuery['filter']) {
		query.filter = await sanitizeFilter(rawQuery['filter'], schema, accountability || null);
	}

	if (rawQuery['offset'] !== undefined) {
		query.offset = sanitizeOffset(rawQuery['offset']);
	}

	if (rawQuery['page']) {
		query.page = sanitizePage(rawQuery['page']);
	}

	if (rawQuery['meta']) {
		(query as any).meta = sanitizeMeta(rawQuery['meta']);
	}

	if (rawQuery['search'] && typeof rawQuery['search'] === 'string') {
		query.search = rawQuery['search'];
	}

	if (rawQuery['version']) {
		query.version = rawQuery['version'];

		// whether or not to merge the relational results
		query.versionRaw = Boolean(
			'versionRaw' in rawQuery && (rawQuery['versionRaw'] === '' || rawQuery['versionRaw'] === 'true'),
		);
	}

	if (rawQuery['export']) {
		query.export = rawQuery['export'] as 'json' | 'csv';
	}

	if (rawQuery['deep'] as Record<string, any>) {
		if (!query.deep) query.deep = {};

		query.deep = await sanitizeDeep(rawQuery['deep'], schema, accountability);
	}

	if (rawQuery['alias']) {
		query.alias = sanitizeAlias(rawQuery['alias']);
	}

	if ('backlink' in rawQuery) {
		query.backlink = sanitizeBacklink(rawQuery['backlink']);
	}

	return query;
}

function sanitizeFields(rawFields: any) {
	if (!rawFields) return null;

	let fields: string[] = [];

	if (typeof rawFields === 'string') {
		fields = splitFields(rawFields);
	} else if (Array.isArray(rawFields)) {
		fields = rawFields as string[];
	} else {
		throw new InvalidQueryError({ reason: '"fields" must be a string or array' });
	}

	// Case where array item includes CSV (fe fields[]=id,name):
	fields = flatten(fields.map((field) => (field.includes(',') ? splitFields(field) : field)));

	fields = fields.map((field) => field.trim());

	return fields;
}

/**
 * Parenthesis aware splitting of fields allowing for `json(a, b)` field functions
 */
function splitFields(input: string): string[] {
	const fields: string[] = [];
	let current = '';
	let depth = 0;

	for (const char of input) {
		if (char === '(') depth++;
		else if (char === ')') depth--;

		if (char === ',' && depth === 0) {
			fields.push(current);
			current = '';
		} else {
			current += char;
		}
	}

	fields.push(current);
	return fields;
}

function sanitizeSort(rawSort: any) {
	let fields: string[] = [];

	if (typeof rawSort === 'string') fields = rawSort.split(',');
	else if (Array.isArray(rawSort)) fields = rawSort as string[];

	fields = fields.map((field) => field.trim());

	return fields;
}

function sanitizeAggregate(rawAggregate: any): Aggregate {
	const logger = useLogger();

	let aggregate: Aggregate = rawAggregate;

	if (typeof rawAggregate === 'string') {
		try {
			aggregate = parseJSON(rawAggregate);
		} catch {
			logger.warn('Invalid value passed for aggregate query parameter.');
		}
	}

	for (const [operation, fields] of Object.entries(aggregate)) {
		if (typeof fields === 'string') aggregate[operation as keyof Aggregate] = (fields as string).split(',');
		else if (Array.isArray(fields)) aggregate[operation as keyof Aggregate] = fields as string[];
	}

	return aggregate as Aggregate;
}

async function sanitizeFilter(rawFilter: any, schema: SchemaOverview, accountability: Accountability | null) {
	let filters = rawFilter;

	if (typeof filters === 'string') {
		try {
			filters = parseJSON(filters);
		} catch {
			throw new InvalidQueryError({ reason: 'Invalid JSON for filter object' });
		}
	}

	try {
		let filterContext;

		if (accountability) {
			const dynamicVariableContext = extractRequiredDynamicVariableContext(filters);

			if (contextHasDynamicVariables(dynamicVariableContext)) {
				const context: Context = {
					schema,
					knex: getDatabase(),
				};

				const policies = await fetchPolicies(accountability, context);

				context.accountability = accountability;

				filterContext = await fetchDynamicVariableData(
					{
						dynamicVariableContext,
						accountability,
						policies,
					},
					context,
				);
			}
		}

		return parseFilter(filters, accountability, filterContext);
	} catch {
		throw new InvalidQueryError({ reason: 'Invalid filter object' });
	}
}

function sanitizeLimit(rawLimit: any) {
	if (rawLimit === undefined || rawLimit === null) return null;
	return Number(rawLimit);
}

function sanitizeOffset(rawOffset: any) {
	return Number(rawOffset);
}

function sanitizePage(rawPage: any) {
	return Number(rawPage);
}

function sanitizeMeta(rawMeta: any) {
	if (rawMeta === '*') {
		return Object.values(Meta);
	}

	if (rawMeta.includes(',')) {
		return rawMeta.split(',');
	}

	if (Array.isArray(rawMeta)) {
		return rawMeta;
	}

	return [rawMeta];
}

function sanitizeBacklink(rawBacklink: unknown) {
	return rawBacklink !== false && rawBacklink !== 'false';
}

async function sanitizeDeep(deep: Record<string, any>, schema: SchemaOverview, accountability?: Accountability | null) {
	const logger = useLogger();

	const result: Record<string, any> = {};

	if (typeof deep === 'string') {
		try {
			deep = parseJSON(deep);
		} catch {
			logger.warn('Invalid value passed for deep query parameter.');
		}
	}

	await parse(deep);

	return result;

	async function parse(level: Record<string, any>, path: string[] = []) {
		const subQuery: Record<string, any> = {};
		const parsedLevel: Record<string, any> = {};

		for (const [key, value] of Object.entries(level)) {
			if (!key) break;

			if (key.startsWith('_')) {
				// Collect all sub query parameters without the leading underscore
				subQuery[key.substring(1)] = value;
			} else if (isPlainObject(value)) {
				parse(value, [...path, key]);
			}
		}

		if (Object.keys(subQuery).length > 0) {
			// Sanitize the entire sub query
			const parsedSubQuery = await sanitizeQuery(subQuery, schema, accountability);

			for (const [parsedKey, parsedValue] of Object.entries(parsedSubQuery)) {
				parsedLevel[`_${parsedKey}`] = parsedValue;
			}
		}

		if (Object.keys(parsedLevel).length > 0) {
			set(result, path, merge({}, get(result, path, {}), parsedLevel));
		}
	}
}

function sanitizeAlias(rawAlias: any) {
	const logger = useLogger();

	let alias: Record<string, string> = rawAlias;

	if (typeof rawAlias === 'string') {
		try {
			alias = parseJSON(rawAlias);
		} catch {
			logger.warn('Invalid value passed for alias query parameter.');
		}
	}

	return alias;
}
