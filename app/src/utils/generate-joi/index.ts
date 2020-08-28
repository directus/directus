import Joi, { AnySchema } from 'joi';

/**
 * @TODO
 * This is copy pasted between app and api. Make this a reusable module.
 */

export default function generateJoi(filter: Record<string, any> | null) {
	filter = filter || {};

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
				schema[key] = Joi.string().custom((value, helpers) => {
					const contains = value.includes(Object.values(value)[0]);

					if (contains === false) {
						return helpers.error(`"${key}" must include "${Object.values(value)[0]}"`);
					}

					return value;
				});
			}

			if (operator === '_ncontains') {
				schema[key] = Joi.string().custom((value, helpers) => {
					const contains = value.includes(Object.values(value)[0]);

					if (contains === true) {
						return helpers.error(`"${key}" can't include "${Object.values(value)[0]}"`);
					}

					return value;
				});
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

	return Joi.object(schema).unknown();
}
