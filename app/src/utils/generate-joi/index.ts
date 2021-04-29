import BaseJoi, { AnySchema } from 'joi';

/**
 * @TODO
 * This is copy pasted between app and api. Make this a reusable module.
 */

const Joi = BaseJoi.extend({
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

type JoiOptions = {
	allowUnknown: boolean;
};

const defaults: JoiOptions = {
	allowUnknown: true,
};

export default function generateJoi(filter: Record<string, any> | null, options?: JoiOptions): any {
	filter = filter || {};

	options = {
		...defaults,
		...(options || {}),
	};

	const schema: Record<string, AnySchema> = {};

	for (const [key, value] of Object.entries(filter)) {
		const isField = key.startsWith('_') === false;

		if (isField) {
			const operator = Object.keys(value)[0];

			if (operator === '_eq') {
				schema[key] = Joi.any().equal(Object.values(value)[0]);
			}

			if (operator === '_neq') {
				schema[key] = Joi.any().not(Object.values(value)[0]);
			}

			if (operator === '_contains') {
				schema[key] = Joi.string().contains(Object.values(value)[0]);
			}

			if (operator === '_ncontains') {
				schema[key] = Joi.string().ncontains(Object.values(value)[0]);
			}

			if (operator === '_in') {
				schema[key] = Joi.any().equal(...(Object.values(value)[0] as (string | number)[]));
			}

			if (operator === '_nin') {
				schema[key] = Joi.any().not(...(Object.values(value)[0] as (string | number)[]));
			}

			if (operator === '_gt') {
				schema[key] = Joi.number().greater(Number(Object.values(value)[0]));
			}

			if (operator === '_gte') {
				schema[key] = Joi.number().min(Number(Object.values(value)[0]));
			}

			if (operator === '_lt') {
				schema[key] = Joi.number().less(Number(Object.values(value)[0]));
			}

			if (operator === '_lte') {
				schema[key] = Joi.number().max(Number(Object.values(value)[0]));
			}

			if (operator === '_null') {
				schema[key] = Joi.any().valid(null);
			}

			if (operator === '_nnull') {
				schema[key] = Joi.any().invalid(null);
			}

			if (operator === '_empty') {
				schema[key] = Joi.any().valid('');
			}

			if (operator === '_nempty') {
				schema[key] = Joi.any().invalid('');
			}

			if (operator === '_between') {
				const values = Object.values(value)[0] as number[];
				schema[key] = Joi.number().greater(values[0]).less(values[1]);
			}

			if (operator === '_nbetween') {
				const values = Object.values(value)[0] as number[];
				schema[key] = Joi.number().less(values[0]).greater(values[1]);
			}
		}
	}

	if (options.allowUnknown) {
		return Joi.object(schema).unknown();
	}

	return Joi.object(schema);
}
