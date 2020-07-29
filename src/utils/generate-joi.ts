import { Filter } from '../types';
import Joi, { AnySchema } from 'joi';

export default function generateJoi(filter: Filter) {
	const schema: Record<string, AnySchema> = {};

	for (const [key, value] of Object.entries(filter)) {
		const isField = key.startsWith('_') === false;

		if (isField) {
			const operator = Object.keys(value)[0];

			/** @TODO
			 * - Extend with all operators
			 */

			if (operator === '_eq') {
				schema[key] = Joi.any().equal(Object.values(value)[0]);
			}

			if (operator === '_neq') {
				schema[key] = Joi.any().not(Object.values(value)[0]);
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

			if (operator === '_lt') {
				schema[key] = Joi.number().less(Number(Object.values(value)[0]));
			}
		}
	}

	return Joi.object(schema).unknown();
}
