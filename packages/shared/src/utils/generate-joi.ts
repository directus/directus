import BaseJoi, { AnySchema, StringSchema as BaseStringSchema, NumberSchema, DateSchema } from 'joi';
import { escapeRegExp, merge } from 'lodash';
import { FieldFilter } from '../types/filter';

export interface StringSchema extends BaseStringSchema {
	contains(substring: string): this;
	ncontains(substring: string): this;
}

export const Joi: typeof BaseJoi = BaseJoi.extend({
	type: 'string',
	base: BaseJoi.string(),
	messages: {
		'string.contains': '{{#label}} must contain [{{#substring}}]',
		'string.ncontains': "{{#label}} can't contain [{{#substring}}]",
	},
	rules: {
		contains: {
			args: [
				{
					name: 'substring',
					ref: true,
					assert: (val) => typeof val === 'string',
					message: 'must be a string',
				},
			],
			method(substring) {
				return this.$_addRule({ name: 'contains', args: { substring } });
			},
			validate(value, helpers, { substring }) {
				if (value.includes(substring) === false) {
					return helpers.error('string.contains', { substring });
				}
				return value;
			},
		},
		ncontains: {
			args: [
				{
					name: 'substring',
					ref: true,
					assert: (val) => typeof val === 'string',
					message: 'must be a string',
				},
			],
			method(substring) {
				return this.$_addRule({ name: 'ncontains', args: { substring } });
			},
			validate(value, helpers, { substring }) {
				if (value.includes(substring) === true) {
					return helpers.error('string.ncontains', { substring });
				}

				return value;
			},
		},
	},
});

export type JoiOptions = {
	requireAll?: boolean;
};

const defaults: JoiOptions = {
	requireAll: false,
};

/**
 * Generate a Joi schema from a filter object.
 *
 * @param {FieldFilter} filter - Field filter object. Note: does not support _and/_or filters.
 * @param {JoiOptions} [options] - Options for the schema generation.
 * @returns {AnySchema} Joi schema.
 */
export function generateJoi(filter: FieldFilter, options?: JoiOptions): AnySchema {
	filter = filter || {};

	options = merge({}, defaults, options);

	const schema: Record<string, AnySchema> = {};

	const key = Object.keys(filter)[0];

	if (!key) {
		throw new Error(`[generateJoi] Filter doesn't contain field key. Passed filter: ${JSON.stringify(filter)}`);
	}

	const value = Object.values(filter)[0];

	if (!value) {
		throw new Error(`[generateJoi] Filter doesn't contain filter rule. Passed filter: ${JSON.stringify(filter)}`);
	}

	if (Object.keys(value)[0]?.startsWith('_') === false) {
		schema[key] = Joi.object({
			[key]: generateJoi(value as FieldFilter, options),
		});
	} else {
		const operator = Object.keys(value)[0];
		const compareValue = Object.values(value)[0];

		const getAnySchema = () => schema[key] ?? Joi.any();
		const getStringSchema = () => (schema[key] ?? Joi.string()) as StringSchema;
		const getNumberSchema = () => (schema[key] ?? Joi.number()) as NumberSchema;
		const getDateSchema = () => (schema[key] ?? Joi.date()) as DateSchema;

		if (operator === '_eq') {
			schema[key] = getAnySchema().equal(compareValue);
		}

		if (operator === '_neq') {
			schema[key] = getAnySchema().not(compareValue);
		}

		if (operator === '_contains') {
			schema[key] = getStringSchema().contains(compareValue);
		}

		if (operator === '_ncontains') {
			schema[key] = getStringSchema().ncontains(compareValue);
		}

		if (operator === '_starts_with') {
			schema[key] = getStringSchema().pattern(new RegExp(`^${escapeRegExp(compareValue as string)}.*`), {
				name: 'starts_with',
			});
		}

		if (operator === '_nstarts_with') {
			schema[key] = getStringSchema().pattern(new RegExp(`^${escapeRegExp(compareValue as string)}.*`), {
				name: 'starts_with',
				invert: true,
			});
		}

		if (operator === '_ends_with') {
			schema[key] = getStringSchema().pattern(new RegExp(`.*${escapeRegExp(compareValue as string)}$`), {
				name: 'ends_with',
			});
		}

		if (operator === '_nends_with') {
			schema[key] = getStringSchema().pattern(new RegExp(`.*${escapeRegExp(compareValue as string)}$`), {
				name: 'ends_with',
				invert: true,
			});
		}

		if (operator === '_in') {
			schema[key] = getAnySchema().equal(...(compareValue as (string | number)[]));
		}

		if (operator === '_nin') {
			schema[key] = getAnySchema().not(...(compareValue as (string | number)[]));
		}

		if (operator === '_gt') {
			schema[key] = Number.isSafeInteger(compareValue)
				? getNumberSchema().greater(compareValue)
				: getDateSchema().greater(compareValue);
		}

		if (operator === '_gte') {
			schema[key] = Number.isSafeInteger(compareValue)
				? getNumberSchema().min(compareValue)
				: getDateSchema().min(compareValue);
		}

		if (operator === '_lt') {
			schema[key] = Number.isSafeInteger(compareValue)
				? getNumberSchema().less(compareValue)
				: getDateSchema().less(compareValue);
		}

		if (operator === '_lte') {
			schema[key] = Number.isSafeInteger(compareValue)
				? getNumberSchema().max(compareValue)
				: getDateSchema().max(compareValue);
		}

		if (operator === '_null') {
			schema[key] = getAnySchema().valid(null);
		}

		if (operator === '_nnull') {
			schema[key] = getAnySchema().invalid(null);
		}

		if (operator === '_empty') {
			schema[key] = getAnySchema().valid('');
		}

		if (operator === '_nempty') {
			schema[key] = getAnySchema().invalid('');
		}

		if (operator === '_between') {
			if (compareValue.every((value: any) => Number.isSafeInteger(value))) {
				const values = compareValue as [number, number];
				schema[key] = getNumberSchema().greater(values[0]).less(values[1]);
			} else {
				const values = compareValue as [string, string];
				schema[key] = getDateSchema().greater(values[0]).less(values[1]);
			}
		}

		if (operator === '_nbetween') {
			if (compareValue.every((value: any) => Number.isSafeInteger(value))) {
				const values = compareValue as [number, number];
				schema[key] = getNumberSchema().less(values[0]).greater(values[1]);
			} else {
				const values = compareValue as [string, string];
				schema[key] = getDateSchema().less(values[0]).greater(values[1]);
			}
		}

		if (operator === '_submitted') {
			schema[key] = getAnySchema().required();
		}

		if (operator === '_regex') {
			const wrapped = compareValue.startsWith('/') && compareValue.endsWith('/');
			schema[key] = getStringSchema().regex(new RegExp(wrapped ? compareValue.slice(1, -1) : compareValue));
		}
	}

	schema[key] = schema[key] ?? Joi.any();

	if (options.requireAll) {
		schema[key] = schema[key]!.required();
	}

	return Joi.object(schema).unknown();
}
