import BaseJoi, { AnySchema } from 'joi';
import { escapeRegExp } from 'lodash';

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

type JoiOptions = {
	allowUnknown: boolean;
};

const defaults: JoiOptions = {
	allowUnknown: true,
};

export default function generateJoi(filter: Record<string, any> | null, options?: JoiOptions): AnySchema {
	filter = filter || {};

	options = {
		...defaults,
		...(options || {}),
	};

	const schema: Record<string, AnySchema> = {};

	for (const [key, value] of Object.entries(filter)) {
		const isField = key.startsWith('_') === false;

		if (isField) {
			if (typeof value !== 'object') {
				schema[key] = Joi.any().equal(value);
				continue;
			}
			const operator = Object.keys(value)[0];

			if (typeof Object.values(value)[0] === 'undefined') {
				continue;
			}

			if (operator === '_between') {
				const betweenValues = Object.values(value)[0] as number[];
				schema[key] = Joi.number().greater(betweenValues[0]).less(betweenValues[1]);
				continue;
			} else if (operator === '_nbetween') {
				const nBetweenValues = Object.values(value)[0] as number[];
				schema[key] = Joi.number().less(nBetweenValues[0]).greater(nBetweenValues[1]);
				continue;
			}

			switch (operator) {
				case '_eq':
					schema[key] = Joi.any().equal(Object.values(value)[0]);
					break;
				case '_neq':
					schema[key] = Joi.any().not(Object.values(value)[0]);
					break;
				case '_contains':
					schema[key] = Joi.string().contains(Object.values(value)[0]);
					break;
				case '_ncontains':
					schema[key] = Joi.string().ncontains(Object.values(value)[0]);
					break;
				case '_starts_with':
					schema[key] = Joi.string().pattern(new RegExp(`^${escapeRegExp(Object.values(value)[0] as string)}.*`));
					break;
				case '_nstarts_with':
					schema[key] = Joi.string().pattern(new RegExp(`^${escapeRegExp(Object.values(value)[0] as string)}.*`), {
						invert: true,
					});
					break;
				case '_ends_with':
					schema[key] = Joi.string().pattern(new RegExp(`.*${escapeRegExp(Object.values(value)[0] as string)}$`));
					break;
				case '_nends_with':
					schema[key] = Joi.string().pattern(new RegExp(`.*${escapeRegExp(Object.values(value)[0] as string)}$`), {
						invert: true,
					});
					break;
				case '_in':
					schema[key] = Joi.any().equal(...(Object.values(value)[0] as (string | number)[]));
					break;
				case '_nin':
					schema[key] = Joi.any().not(...(Object.values(value)[0] as (string | number)[]));
					break;
				case '_gt':
					schema[key] = Joi.number().greater(Number(Object.values(value)[0]));
					break;
				case '_gte':
					schema[key] = Joi.number().min(Number(Object.values(value)[0]));
					break;
				case '_lt':
					schema[key] = Joi.number().less(Number(Object.values(value)[0]));
					break;
				case '_lte':
					schema[key] = Joi.number().max(Number(Object.values(value)[0]));
					break;
				case '_null':
					schema[key] = Joi.any().valid(null);
					break;
				case '_nnull':
					schema[key] = Joi.any().invalid(null);
					break;
				case '_empty':
					schema[key] = Joi.any().valid('');
					break;
				case '_nempty':
					schema[key] = Joi.any().invalid('');
					break;
				default:
					schema[key] = Joi.any().equal(Object.values(value)[0]);
					break;
			}
		}
	}

	if (options.allowUnknown) {
		return Joi.object(schema).unknown();
	}

	return Joi.object(schema);
}
