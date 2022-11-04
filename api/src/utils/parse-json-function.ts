import { InvalidQueryException } from '../exceptions';
import { stripFunction } from './strip-function';

// export const JSON_QUERY_REGEX = /^(\w+)(\.(\w+|\*)|\[-?(\d+|\*)\])+$/i; // with negative indexes
// export const JSON_QUERY_REGEX = /^json\((\w+)(\.(\w+|\*)|\[(\d+|\*)\])+\)$/i;
export const JSON_QUERY_REGEX = /^json\(\w+(\.\w+)?\$(\.(\w+|\*)|\[(\d+|\*)\])+\)/i;

/**
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
