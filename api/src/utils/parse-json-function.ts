import { InvalidQueryException } from '../exceptions';
import { stripFunction } from './strip-function';

// used to limit all the shenanigans JSONPath accepts to a consistently supported subset
export const JSON_QUERY_REGEX = /^json\([\w:]+(\.[\w:]+)*\$(\.(\w+|\*)|\[(\d+|\*)\])+\)/i;

/**
 * Parse a "JSON(field$.path)"" string into sub elements
 */
export function parseJsonFunction(data: string) {
	if (!JSON_QUERY_REGEX.test(data)) {
		throw new InvalidQueryException(`The json query used is not valid. "${data}"`);
	}
	const content = stripFunction(data);
	const pathStart = content.indexOf('$');
	return {
		fieldName: content.substring(0, pathStart),
		jsonPath: content.substring(pathStart),
	};
}
