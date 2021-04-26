import { Filter } from '../types';
import BaseJoi, { AnySchema } from 'joi';

const Joi: typeof BaseJoi = BaseJoi.extend({
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
			validate(value, helpers, { substring }, options) {
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
			validate(value, helpers, { substring }, options) {
				if (value.includes(substring) === true) {
					return helpers.error('string.ncontains', { substring });
				}

				return value;
			},
		},
	},
});

export default function generateJoi(filter: Filter | null): AnySchema {
	filter = filter || {};

	if (Object.keys(filter).length === 0) return Joi.any();

	let schema: any;

	for (const [key, value] of Object.entries(filter)) {
		if (key.startsWith('_') === false) {
			if (!schema) schema = {};

			const operator = Object.keys(value)[0];
			const val = Object.values(value)[0];

			schema[key] = getJoi(operator, val);
		}
	}

	return Joi.object(schema).unknown();
}

function getJoi(operator: string, value: any) {
	if (operator === '_eq') {
		return Joi.any().equal(value);
	}

	if (operator === '_neq') {
		return Joi.any().not(value);
	}

	if (operator === '_contains') {
		// @ts-ignore
		return Joi.string().contains(value);
	}

	if (operator === '_ncontains') {
		// @ts-ignore
		return Joi.string().ncontains(value);
	}

	if (operator === '_in') {
		return Joi.any().equal(...(value as (string | number)[]));
	}

	if (operator === '_nin') {
		return Joi.any().not(...(value as (string | number)[]));
	}

	if (operator === '_gt') {
		return Joi.number().greater(Number(value));
	}

	if (operator === '_gte') {
		return Joi.number().min(Number(value));
	}

	if (operator === '_lt') {
		return Joi.number().less(Number(value));
	}

	if (operator === '_lte') {
		return Joi.number().max(Number(value));
	}

	if (operator === '_null') {
		return Joi.any().valid(null);
	}

	if (operator === '_nnull') {
		return Joi.any().invalid(null);
	}

	if (operator === '_empty') {
		return Joi.any().valid('');
	}

	if (operator === '_nempty') {
		return Joi.any().invalid('');
	}

	if (operator === '_between') {
		const values = value as number[];
		return Joi.number().greater(values[0]).less(values[1]);
	}

	if (operator === '_nbetween') {
		const values = value as number[];
		return Joi.number().less(values[0]).greater(values[1]);
	}

	if (operator === '_submitted') {
		return Joi.required();
	}

	if (operator === '_regex') {
		const wrapped = value.startsWith('/') && value.endsWith('/');
		return Joi.string().regex(new RegExp(wrapped ? value.slice(1, -1) : value));
	}
}
