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
 * @param {any} [itemsBeforeUpdate] - Optional items before update
 * @returns Array of errors
 */
export function validatePayload(
	filter: Filter,
	payload: Record<string, any>,
	options?: JoiOptions,
	itemsBeforeUpdate?: any
): Joi.ValidationError[] {
	const errors: Joi.ValidationError[] = [];

	/**
	 * Note there can only be a single _and / _or per level
	 */

	if (Object.keys(filter)[0] === '_and') {
		const subValidation = Object.values(filter)[0] as FieldFilter[];

		const nestedErrors = flatten<Joi.ValidationError>(
			subValidation.map((subObj: Record<string, any>) => {
				return validatePayload(subObj, payload, options, itemsBeforeUpdate);
			})
		).filter((err?: Joi.ValidationError) => err);

		errors.push(...nestedErrors);
	} else if (Object.keys(filter)[0] === '_or') {
		const subValidation = Object.values(filter)[0] as FieldFilter[];

		const nestedErrors = flatten<Joi.ValidationError>(
			subValidation.map((subObj: Record<string, any>) => validatePayload(subObj, payload, options, itemsBeforeUpdate))
		);

		const allErrored = subValidation.length === nestedErrors.length;

		if (allErrored) {
			errors.push(...nestedErrors);
		}
	} else {
		if (!itemsBeforeUpdate || itemsBeforeUpdate.length == 0) {
			const payloadWithFunctions = injectFunctionResults(payload, filter);
			const schema = generateJoi(filter as FieldFilter, options);

			const { error } = schema.validate(payloadWithFunctions, { abortEarly: false });

			if (error) {
				errors.push(error);
			}
		} else if (itemsBeforeUpdate && itemsBeforeUpdate.length > 0) {
			for (const item of itemsBeforeUpdate) {
				const payloadWithFunctions = injectFunctionResults(payload, filter, item);
				const schema = generateJoi(filter as FieldFilter, options);

				const { error } = schema.validate(payloadWithFunctions, { abortEarly: false });

				if (error) {
					errors.push(error);
					break;
				}
			}
		}
	}

	return errors;
}
