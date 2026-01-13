import type { FieldFilter, Filter } from '@directus/types';
import type { SchemaOverview } from '@directus/types';
import type { AnySchema } from 'joi';
import { deepMapFilter } from './deep-map-filter.js';
import { generateJoi, Joi } from './generate-joi.js';

export function generateFilterValidator(filter: Filter, collection: string, schema: SchemaOverview) {
	const validator = deepMapFilter(
		filter,
		([key, value], context) => {
			if (context.leaf) {
				const validator = generateJoi({ [key]: value } as FieldFilter, { requireAll: true });

				return [key, validator];
			} else if (key === '_and') {
				const validator = Joi.custom((val, helpers) => {
					for (const item of value as AnySchema[]) {
						const { error } = Object.values(item)[0].validate(val);

						if (error) {
							return helpers.error('any.custom', { message: error.message });
						}
					}

					return val;
				});

				return [key, validator];
			} else if (key === '_or') {
				const validator = Joi.custom((val, helpers) => {
					let pass = false;

					for (const item of value as AnySchema[]) {
						const { error } = Object.values(item)[0].validate(val);

						if (!error) {
							pass = true;
							break;
						}
					}

					if (!pass) {
						return helpers.error('any.custom', { message: `Value does not match any of the _or conditions` });
					}

					return val;
				});

				return [key, validator];
			} else if (context.relationType === 'o2m' || context.relationType === 'o2a') {
				let arrayValidator;

				if (context.quantity === 'some') {
					arrayValidator = Joi.array().has(Object.values(value as any)[0] as AnySchema);
				} else if (context.quantity === 'none') {
					arrayValidator = Joi.array().items((Object.values(value as any)[0] as AnySchema).forbidden());
				} else {
					arrayValidator = Joi.array().items((Object.values(value as any)[0] as AnySchema).required());
				}

				return [
					key,
					Joi.object({
						[key]: arrayValidator,
					}),
				];
			} else if (context.relationType === 'a2o') {
				return [
					key,
					Joi.object({
						[key]: Joi.when('collection', {
							is: Joi.string().valid(context.targetCollection),
							then: (Object.values(value as any)[0] as AnySchema).required(),
						}),
						collection: Joi.string(),
					}).unknown(),
				];
			} else {
				return [
					key,
					Joi.object({
						[key]: (Object.values(value as any)[0] as AnySchema).required(),
					}).unknown(),
				];
			}
		},
		{
			collection,
			schema,
		},
	);

	return Object.values(validator)[0] as AnySchema;
}
