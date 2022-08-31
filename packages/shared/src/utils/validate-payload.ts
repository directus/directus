import { FieldFilter, Filter } from '../types/filter';
import { flatten } from 'lodash';
import { generateJoi, JoiOptions } from './generate-joi';
import { injectFunctionResults } from './inject-function-results';
import Joi from 'joi';

/**
 * Validate the payload against the given filter rules
 *
 * @param {Filter} filter - The filter rules to check against
 * @param {Record<string, any>} payload - The payload to validate
 * @param {JoiOptions} [options] - Optional options to pass to Joi
 * @returns Array of errors
 */
export function validatePayload(
	filter: Filter,
	payload: Record<string, any>,
	options?: JoiOptions
): Joi.ValidationError[] {
	const errors: Joi.ValidationError[] = [];

	/**
	 * Note there can only be a single _and / _or per level
	 */

	if (Object.keys(filter)[0] === '_and') {
		const subValidation = Object.values(filter)[0] as FieldFilter[];

		const nestedErrors = flatten<Joi.ValidationError>(
			subValidation.map((subObj: Record<string, any>) => {
				return validatePayload(subObj, payload, options);
			})
		).filter((err?: Joi.ValidationError) => err);

		errors.push(...nestedErrors);
	} else if (Object.keys(filter)[0] === '_or') {
		const subValidation = Object.values(filter)[0] as FieldFilter[];

		const swallowErrors: Joi.ValidationError[] = [];

		const pass = subValidation.some((subObj: Record<string, any>) => {
			const nestedErrors = validatePayload(subObj, payload, options);
			if (nestedErrors.length > 0) {
				swallowErrors.push(...nestedErrors);
				return false;
			}
			return true;
		});

		if (!pass) {
			errors.push(...swallowErrors);
		}
	} else {
		const payloadWithFunctions = injectFunctionResults(payload, filter);
		const schema = generateJoi(filter as FieldFilter, options);

		const { error } = schema.validate(payloadWithFunctions, { abortEarly: false });

		if (error) {
			errors.push(error);
		}
	}

	return errors;
}
