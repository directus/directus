import { beforeEach, test, expect } from 'vitest';
import { randomInteger } from './integer.js';
import { randomSequence } from './sequence.js';
import { randomArray } from './array.js';

let sample: {
	length: number;
	characters: string;
};

beforeEach(() => {
	sample = {
		length: randomInteger(0, 15),
		characters: randomArray(['abcdefg', 'hijklmnop', 'qrstuvwxyz', '0123456789']),
	};
});

test('Returns random sequence of given length', () => {
	const output = randomSequence(sample.length, sample.characters);
	expect(output.length).toBe(sample.length);
});

test('Only returns characters from given set', () => {
	const output = randomSequence(sample.length, sample.characters);
	output.split('').every((char) => expect(sample.characters.includes(char)).toBe(true));
});
