import acronyms from '../constants/acronyms.js';
import articles from '../constants/articles.js';
import conjunctions from '../constants/conjunctions.js';
import prepositions from '../constants/prepositions.js';
import specialCase from '../constants/special-case.js';

/**
 * See https://apastyle.apa.org/style-grammar-guidelines/capitalization/title-case for the rules
 */
export function handleSpecialWords(str: string, index: number, words: string[]): string {
	const lowercaseStr = str.toLowerCase();
	const uppercaseStr = str.toUpperCase();

	for (const special of specialCase) {
		if (special.toLowerCase() === lowercaseStr) return special;
	}

	if (acronyms.includes(uppercaseStr)) return uppercaseStr;

	// If the word is the first word in the sentence, but it's not a specially
	// cased word or an acronym, return the capitalized string
	if (index === 0) return str;

	// If the word is the last word in the sentence, but it's not a specially
	// cased word or an acronym, return the capitalized string
	if (index === words.length - 1) return str;

	// Return the word capitalized if it's 4 characters or more
	if (str.length >= 4) return str;

	if (prepositions.includes(lowercaseStr)) return lowercaseStr;
	if (conjunctions.includes(lowercaseStr)) return lowercaseStr;
	if (articles.includes(lowercaseStr)) return lowercaseStr;

	return str;
}
