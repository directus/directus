import { Query } from '../types';
import Joi from 'joi';
import { InvalidQueryException } from '../exceptions';
import { isPlainObject } from 'lodash';

const querySchema = Joi.object({
	fields: Joi.array().items(Joi.string()),
	sort: Joi.array().items(
		Joi.object({
			column: Joi.string(),
			order: Joi.string().valid('asc', 'desc'),
		})
	),
	filter: Joi.object({}).unknown(),
	limit: Joi.number(),
	offset: Joi.number(),
	page: Joi.number(),
	single: Joi.boolean(),
	meta: Joi.array().items(Joi.string().valid('total_count', 'filter_count')),
	search: Joi.string(),
	export: Joi.string().valid('json', 'csv'),
	deep: Joi.object().pattern(/\w+/, Joi.link('#query')),
}).id('query');

export function validateQuery(query: Query) {
	const { error } = querySchema.validate(query);

	if (query.filter && Object.keys(query.filter).length > 0) {
		validateFilter(query.filter);
	}

	if (error) {
		throw new InvalidQueryException(error.message);
	}

	return query;
}

function validateFilter(filter: Query['filter']) {
	if (!filter) throw new InvalidQueryException('Invalid filter object');

	for (let [key, nested] of Object.entries(filter)) {
		if (key === '_and' || key === '_or') {
			nested.forEach(validateFilter);
		} else if (isPlainObject(nested)) {
			validateFilter(nested);
		} else if (key.startsWith('_')) {
			const value = nested;

			switch (key) {
				case '_eq':
				case '_neq':
				case '_contains':
				case '_ncontains':
				case '_gt':
				case '_gte':
				case '_lt':
				case '_lte':
				default:
					validateFilterPrimitive(value, key);
					break;
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
			}
		} else if (isPlainObject(nested) === false && Array.isArray(nested) === false) {
			validateFilterPrimitive(nested, '_eq');
		} else {
			validateFilter(nested);
		}
	}
}

function validateFilterPrimitive(value: any, key: string) {
	if (
		(typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || value instanceof Date) ===
		false
	) {
		throw new InvalidQueryException(`The filter value for "${key}" has to be a string, number, or boolean`);
	}

	if (typeof value === 'number' && Number.isNaN(value)) {
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
	if (typeof value !== 'boolean') {
		throw new InvalidQueryException(`"${key}" has to be a boolean`);
	}

	return true;
}
