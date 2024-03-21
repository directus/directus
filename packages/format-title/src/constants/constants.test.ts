import { expect, test } from 'vitest';
import acronyms from '../constants/acronyms.js';
import specialCase from '../constants/special-case.js';

const lists: string[][] = [acronyms, specialCase];

test('Words should not be duplicated in lists', () => {
	const words: string[] = [];
	let hasDuplicate = false;

	for (const list of lists) {
		for (const word of list) {
			if (words.includes(word)) {
				console.log(`Duplicated word: "${word}"`);
				hasDuplicate = true;
			} else {
				words.push(word);
			}
		}
	}

	expect(hasDuplicate).toBe(false);
});
