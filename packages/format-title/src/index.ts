import prepositions from './prepositions';
import conjunctions from './conjunctions';
import acronyms from './acronyms';
import specialCase from './special-case';

function handleSpecialWords(str: string, index: number, words: string[]): string {
	const lowercaseStr = str.toLowerCase();
	const uppercaseStr = str.toUpperCase();

	for (let i = 0; i < specialCase.length; i += 1) {
		if (specialCase[i].toLowerCase() === lowercaseStr) return specialCase[i];
	}

	if (acronyms.includes(uppercaseStr)) return uppercaseStr;

	// If the word is the first word in the sentence, but it's not a specially
	// cased word or an acronym, return the capitalized string
	if (index === 0) return str;

	// If the word is the last word in the sentence, but it's not a specially
	// cased word or an acronym, return the capitalized string
	if (index === words.length - 1) return str;

	if (prepositions.includes(lowercaseStr)) return lowercaseStr;
	if (conjunctions.includes(lowercaseStr)) return lowercaseStr;

	return str;
}

function combine(acc: string, str: string): string {
	return `${acc} ${str}`;
}

function capitalize(word: string): string {
	return word.charAt(0).toUpperCase() + word.substring(1);
}

function decamelize(string: string): string {
	return string
		.replace(/([a-z\d])([A-Z])/g, '$1_$2')
		.replace(/([A-Z]+)([A-Z][a-z\d]+)/g, '$1_$2')
		.toLowerCase();
}

export default function formatTitle(title: string, separator?: RegExp): string {
	if (!separator) separator = new RegExp('/s|-|_| ', 'g');
	return decamelize(title)
		.split(separator)
		.map(capitalize)
		.map(handleSpecialWords)
		.reduce(combine);
}
