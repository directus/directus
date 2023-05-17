import { expect, test } from 'vitest';
import { defaults } from './defaults.js';

test('Returns defaults with input properties assigned', () => {
	expect(defaults({ input: true }, { default: 'test' })).toEqual({
		input: true,
		default: 'test',
	});
});

test('Overwrites undefined values in input object', () => {
	type Input = { default: undefined | string };

	expect(defaults({ default: undefined } as Input, { default: 'test' })).toEqual({
		default: 'test',
	});
});
