import { capitalize } from './utils/capitalize.js';
import { combine } from './utils/combine.js';
import { decamelize } from './utils/decamelize.js';
import { handleSpecialWords } from './utils/handle-special-words.js';

export function formatTitle(title: string, separator: RegExp = new RegExp('\\s|-|_', 'g')): string {
	// Drop empty segments produced by leading, trailing, or consecutive separators
	// (e.g. `foo__bar`, `_id`, `trailing_`). Without this they survive as empty words
	// and `combine` pads them with spaces, yielding stray/leading/trailing spaces like
	// "Foo  Bar" — and they also skew the first/last-word casing rules in handleSpecialWords.
	const words = decamelize(title)
		.split(separator)
		.filter((word) => word.length > 0)
		.map(capitalize)
		.map(handleSpecialWords);

	if (words.length === 0) return '';

	return words.reduce(combine);
}

export default formatTitle;
