import type { FieldFilter } from '@directus/types';
import type { AnySchema, StringSchema as BaseStringSchema, DateSchema, NumberSchema } from 'joi';
import BaseJoi from 'joi';
import { escapeRegExp, merge } from 'lodash-es';

export interface StringSchema extends BaseStringSchema {
	contains(substring: string): this;
	icontains(substring: string): this;
	ncontains(substring: string): this;
}

export const Joi: typeof BaseJoi = BaseJoi.extend({
	type: 'string',
	base: BaseJoi.string(),
	messages: {
		'string.contains': '{{#label}} must contain [{{#substring}}]',
		'string.icontains': '{{#label}} must contain case insensitive [{{#substring}}]',
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
		icontains: {
			args: [
				{
					name: 'substring',
					ref: true,
					assert: (val) => typeof val === 'string',
					message: 'must be a string',
				},
			],
			method(substring) {
				return this.$_addRule({ name: 'icontains', args: { substring } });
			},
			validate(value: string, helpers, { substring }) {
				if (value.toLowerCase().includes(substring.toLowerCase()) === false) {
					return helpers.error('string.icontains', { substring });
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
 * Generate a Joi schema from a field filter object. This does not support relations or logical operators (_and/_or).
 */

export function generateJoi(filter: FieldFilter | null, options?: JoiOptions): AnySchema {
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
		schema[key] = generateJoi(value as FieldFilter, options);
	} else {
		const operator = Object.keys(value)[0];
		const compareValue = Object.values(value)[0];

		const getAnySchema = () => schema[key] ?? Joi.any();
		const getStringSchema = () => (schema[key] ?? Joi.string()) as StringSchema;
		const getNumberSchema = () => (schema[key] ?? Joi.number()) as NumberSchema;
		const getDateSchema = () => (schema[key] ?? Joi.date()) as DateSchema;

		if (operator === '_eq') {
			let typecastedValue: string | number;

			if (typeof compareValue === 'number') {
				typecastedValue = String(compareValue);
			} else {
				typecastedValue = [null, '', true, false].includes(compareValue) ? NaN : Number(compareValue);
			}

			if (typeof typecastedValue === 'number' && isNaN(typecastedValue)) {
				schema[key] = getAnySchema().equal(compareValue);
			} else {
				schema[key] = getAnySchema().equal(compareValue, typecastedValue);
			}
		}

		if (operator === '_neq') {
			let typecastedValue: string | number;

			if (typeof compareValue === 'number') {
				typecastedValue = String(compareValue);
			} else {
				typecastedValue = [null, '', true, false].includes(compareValue) ? NaN : Number(compareValue);
			}

			if (typeof typecastedValue === 'number' && isNaN(typecastedValue)) {
				schema[key] = getAnySchema().not(compareValue);
			} else {
				schema[key] = getAnySchema().not(compareValue, typecastedValue);
			}
		}

		if (operator === '_contains') {
			if (compareValue === null || compareValue === undefined || typeof compareValue !== 'string') {
				schema[key] = Joi.any().equal(true);
			} else {
				schema[key] = Joi.alternatives().try(
					getStringSchema().contains(compareValue),
					Joi.array().items(getStringSchema().contains(compareValue).required(), Joi.any()),
				);
			}
		}

		if (operator === '_icontains') {
			if (compareValue === null || compareValue === undefined || typeof compareValue !== 'string') {
				schema[key] = Joi.any().equal(true);
			} else {
				schema[key] = Joi.alternatives().try(
					getStringSchema().icontains(compareValue),
					Joi.array().items(getStringSchema().icontains(compareValue).required(), Joi.any()),
				);
			}
		}

		if (operator === '_ncontains') {
			if (compareValue === null || compareValue === undefined || typeof compareValue !== 'string') {
				schema[key] = Joi.any().equal(true);
			} else {
				schema[key] = Joi.alternatives().try(
					getStringSchema().ncontains(compareValue),
					Joi.array().items(getStringSchema().contains(compareValue).forbidden()),
				);
			}
		}

		if (operator === '_starts_with') {
			if (compareValue === null || compareValue === undefined || typeof compareValue !== 'string') {
				schema[key] = Joi.any().equal(true);
			} else {
				schema[key] = getStringSchema().pattern(new RegExp(`^${escapeRegExp(compareValue)}.*`), {
					name: 'starts_with',
				});
			}
		}

		if (operator === '_nstarts_with') {
			if (compareValue === null || compareValue === undefined || typeof compareValue !== 'string') {
				schema[key] = Joi.any().equal(true);
			} else {
				schema[key] = getStringSchema().pattern(new RegExp(`^${escapeRegExp(compareValue)}.*`), {
					name: 'nstarts_with',
					invert: true,
				});
			}
		}

		if (operator === '_istarts_with') {
			if (compareValue === null || compareValue === undefined || typeof compareValue !== 'string') {
				schema[key] = Joi.any().equal(true);
			} else {
				schema[key] = getStringSchema().pattern(new RegExp(`^${escapeRegExp(compareValue)}.*`, 'i'), {
					name: 'istarts_with',
				});
			}
		}

		if (operator === '_nistarts_with') {
			if (compareValue === null || compareValue === undefined || typeof compareValue !== 'string') {
				schema[key] = Joi.any().equal(true);
			} else {
				schema[key] = getStringSchema().pattern(new RegExp(`^${escapeRegExp(compareValue)}.*`, 'i'), {
					name: 'nistarts_with',
					invert: true,
				});
			}
		}

		if (operator === '_ends_with') {
			if (compareValue === null || compareValue === undefined || typeof compareValue !== 'string') {
				schema[key] = Joi.any().equal(true);
			} else {
				schema[key] = getStringSchema().pattern(new RegExp(`.*${escapeRegExp(compareValue)}$`), {
					name: 'ends_with',
				});
			}
		}

		if (operator === '_nends_with') {
			if (compareValue === null || compareValue === undefined || typeof compareValue !== 'string') {
				schema[key] = Joi.any().equal(true);
			} else {
				schema[key] = getStringSchema().pattern(new RegExp(`.*${escapeRegExp(compareValue)}$`), {
					name: 'nends_with',
					invert: true,
				});
			}
		}

		if (operator === '_iends_with') {
			if (compareValue === null || compareValue === undefined || typeof compareValue !== 'string') {
				schema[key] = Joi.any().equal(true);
			} else {
				schema[key] = getStringSchema().pattern(new RegExp(`.*${escapeRegExp(compareValue)}$`, 'i'), {
					name: 'iends_with',
				});
			}
		}

		if (operator === '_niends_with') {
			if (compareValue === null || compareValue === undefined || typeof compareValue !== 'string') {
				schema[key] = Joi.any().equal(true);
			} else {
				schema[key] = getStringSchema().pattern(new RegExp(`.*${escapeRegExp(compareValue)}$`, 'i'), {
					name: 'niends_with',
					invert: true,
				});
			}
		}

		if (operator === '_in') {
			schema[key] = getAnySchema().equal(...(compareValue as (string | number)[]));
		}

		if (operator === '_nin') {
			schema[key] = getAnySchema().not(...(compareValue as (string | number)[]));
		}

		if (operator === '_gt') {
			const isDate = compareValue instanceof Date || Number.isNaN(Number(compareValue));

			schema[key] = isDate
				? getDateSchema().greater(compareValue as string | Date)
				: getNumberSchema().greater(Number(compareValue));
		}

		if (operator === '_gte') {
			const isDate = compareValue instanceof Date || Number.isNaN(Number(compareValue));

			schema[key] = isDate
				? getDateSchema().min(compareValue as string | Date)
				: getNumberSchema().min(Number(compareValue));
		}

		if (operator === '_lt') {
			const isDate = compareValue instanceof Date || Number.isNaN(Number(compareValue));

			schema[key] = isDate
				? getDateSchema().less(compareValue as string | Date)
				: getNumberSchema().less(Number(compareValue));
		}

		if (operator === '_lte') {
			const isDate = compareValue instanceof Date || Number.isNaN(Number(compareValue));

			schema[key] = isDate
				? getDateSchema().max(compareValue as string | Date)
				: getNumberSchema().max(Number(compareValue));
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
			if (
				(compareValue as any).every((value: any) => {
					const val = Number(value instanceof Date ? NaN : value);
					return !Number.isNaN(val) && Math.abs(val) <= Number.MAX_SAFE_INTEGER;
				})
			) {
				const values = compareValue as [number, number];
				schema[key] = getNumberSchema().min(Number(values[0])).max(Number(values[1]));
			} else {
				const values = compareValue as [string, string];
				schema[key] = getDateSchema().min(values[0]).max(values[1]);
			}
		}

		if (operator === '_nbetween') {
			if (
				(compareValue as any).every((value: any) => {
					const val = Number(value instanceof Date ? NaN : value);
					return !Number.isNaN(val) && Math.abs(val) <= Number.MAX_SAFE_INTEGER;
				})
			) {
				const values = compareValue as [number, number];
				schema[key] = getNumberSchema().less(Number(values[0])).greater(Number(values[1]));
			} else {
				const values = compareValue as [string, string];
				schema[key] = getDateSchema().less(values[0]).greater(values[1]);
			}
		}

		if (operator === '_submitted') {
			schema[key] = getAnySchema().required();
		}

		if (operator === '_regex') {
			if (compareValue === null || compareValue === undefined) {
				schema[key] = Joi.any().equal(true);
			} else {
				const wrapped =
					typeof compareValue === 'string' ? compareValue.startsWith('/') && compareValue.endsWith('/') : false;

				schema[key] = getStringSchema()
					.min(0)
					.regex(new RegExp(wrapped ? (compareValue as any).slice(1, -1) : compareValue));
			}
		}
	}

	schema[key] = schema[key] ?? Joi.any();

	if (options.requireAll) {
		schema[key] = schema[key]!.required();
	}

	return Joi.object(schema).unknown();
}
