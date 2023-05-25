import type { Query } from '@directus/types';
import Joi from 'joi';
import { isPlainObject, uniq } from 'lodash-es';
import { stringify } from 'wellknown';
import env from '../env.js';
import { InvalidQueryException } from '../exceptions/invalid-query.js';
import { calculateFieldDepth } from './calculate-field-depth.js';

const querySchema = Joi.object({
	fields: Joi.array().items(Joi.string()),
	group: Joi.array().items(Joi.string()),
	sort: Joi.array().items(Joi.string()),
	filter: Joi.object({}).unknown(),
	limit:
		'QUERY_LIMIT_MAX' in env && env['QUERY_LIMIT_MAX'] !== -1
			? Joi.number().integer().min(-1).max(env['QUERY_LIMIT_MAX']) // min should be 0
			: Joi.number().integer().min(-1),
	offset: Joi.number().integer().min(0),
	page: Joi.number().integer().min(0),
	meta: Joi.array().items(Joi.string().valid('total_count', 'filter_count')),
	search: Joi.string(),
	export: Joi.string().valid('csv', 'json', 'xml', 'yaml'),
	aggregate: Joi.object(),
	deep: Joi.object(),
	alias: Joi.object(),
}).id('query');

export function validateQuery(query: Query): Query {
	const { error } = querySchema.validate(query);

	if (query.filter && Object.keys(query.filter).length > 0) {
		validateFilter(query.filter);
	}

	if (query.alias) {
		validateAlias(query.alias);
	}

	validateRelationalDepth(query);

	if (error) {
		throw new InvalidQueryException(error.message);
	}

	return query;
}

function validateFilter(filter: Query['filter']) {
	if (!filter) throw new InvalidQueryException('Invalid filter object');

	for (const [key, nested] of Object.entries(filter)) {
		if (key === '_and' || key === '_or') {
			nested.forEach(validateFilter);
		} else if (key.startsWith('_')) {
			const value = nested;

			switch (key) {
				case '_in':
				case '_nin':
				case '_between':
				case '_nbetween':
					validateList(value, key);
					break;
				case '_null':
				case '_nnull':
				case '_empty':
				case '_nempty':
					validateBoolean(value, key);
					break;

				case '_intersects':
				case '_nintersects':
				case '_intersects_bbox':
				case '_nintersects_bbox':
					validateGeometry(value, key);
					break;
				case '_none':
				case '_some':
					validateFilter(nested);
					break;
				case '_eq':
				case '_neq':
				case '_contains':
				case '_ncontains':
				case '_starts_with':
				case '_nstarts_with':
				case '_ends_with':
				case '_nends_with':
				case '_gt':
				case '_gte':
				case '_lt':
				case '_lte':
				default:
					validateFilterPrimitive(value, key);
					break;
			}
		} else if (isPlainObject(nested)) {
			validateFilter(nested);
		} else if (Array.isArray(nested) === false) {
			validateFilterPrimitive(nested, '_eq');
		} else {
			validateFilter(nested);
		}
	}
}

function validateFilterPrimitive(value: any, key: string) {
	if (value === null) return true;

	if (
		(typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || value instanceof Date) ===
		false
	) {
		throw new InvalidQueryException(`The filter value for "${key}" has to be a string, number, or boolean`);
	}

	if (typeof value === 'number' && (Number.isNaN(value) || value > Number.MAX_SAFE_INTEGER)) {
		throw new InvalidQueryException(`The filter value for "${key}" is not a valid number`);
	}

	if (typeof value === 'string' && value.length === 0) {
		throw new InvalidQueryException(
			`You can't filter for an empty string in "${key}". Use "_empty" or "_nempty" instead`
		);
	}

	return true;
}

function validateList(value: any, key: string) {
	if (Array.isArray(value) === false || value.length === 0) {
		throw new InvalidQueryException(`"${key}" has to be an array of values`);
	}

	return true;
}

function validateBoolean(value: any, key: string) {
	if (value === null) return true;

	if (typeof value !== 'boolean') {
		throw new InvalidQueryException(`"${key}" has to be a boolean`);
	}

	return true;
}

function validateGeometry(value: any, key: string) {
	if (value === null) return true;

	try {
		stringify(value);
	} catch {
		throw new InvalidQueryException(`"${key}" has to be a valid GeoJSON object`);
	}

	return true;
}

function validateAlias(alias: any) {
	if (isPlainObject(alias) === false) {
		throw new InvalidQueryException(`"alias" has to be an object`);
	}

	for (const [key, value] of Object.entries(alias)) {
		if (typeof key !== 'string') {
			throw new InvalidQueryException(`"alias" key has to be a string. "${typeof key}" given.`);
		}

		if (typeof value !== 'string') {
			throw new InvalidQueryException(`"alias" value has to be a string. "${typeof key}" given.`);
		}

		if (key.includes('.') || value.includes('.')) {
			throw new InvalidQueryException(`"alias" key/value can't contain a period character \`.\``);
		}
	}
}

function validateRelationalDepth(query: Query) {
	const maxRelationalDepth = Number(env['MAX_RELATIONAL_DEPTH']) > 2 ? Number(env['MAX_RELATIONAL_DEPTH']) : 2;

	// Process the fields in the same way as api/src/utils/get-ast-from-query.ts
	let fields = ['*'];

	if (query.fields) {
		fields = query.fields;
	}

	/**
	 * When using aggregate functions, you can't have any other regular fields
	 * selected. This makes sure you never end up in a non-aggregate fields selection error
	 */
	if (Object.keys(query.aggregate || {}).length > 0) {
		fields = [];
	}

	/**
	 * Similarly, when grouping on a specific field, you can't have other non-aggregated fields.
	 * The group query will override the fields query
	 */
	if (query.group) {
		fields = query.group;
	}

	fields = uniq(fields);

	for (const field of fields) {
		if (field.split('.').length > maxRelationalDepth) {
			throw new InvalidQueryException('Max relational depth exceeded.');
		}
	}

	if (query.filter) {
		const filterRelationalDepth = calculateFieldDepth(query.filter);

		if (filterRelationalDepth > maxRelationalDepth) {
			throw new InvalidQueryException('Max relational depth exceeded.');
		}
	}

	if (query.sort) {
		for (const sort of query.sort) {
			if (sort.split('.').length > maxRelationalDepth) {
				throw new InvalidQueryException('Max relational depth exceeded.');
			}
		}
	}

	if (query.deep) {
		const deepRelationalDepth = calculateFieldDepth(query.deep, ['_sort']);

		if (deepRelationalDepth > maxRelationalDepth) {
			throw new InvalidQueryException('Max relational depth exceeded.');
		}
	}
}
