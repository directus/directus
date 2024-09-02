import { decamelize } from './utils/decamelize.js';
import { capitalize } from './utils/capitalize.js';
import { handleSpecialWords } from './utils/handle-special-words.js';
import { combine } from './utils/combine.js';

export function formatTitle(title: string, separator = new RegExp('\\s|-|_', 'g')): string {
	return decamelize(title).split(separator).map(capitalize).map(handleSpecialWords).reduce(combine);
}

export default formatTitle;
