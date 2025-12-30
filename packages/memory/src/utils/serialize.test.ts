import { deserialize, serialize } from './serialize.js';
import { expect, test } from 'vitest';

const cases: [string, unknown][] = [
	['object', { hello: 'world' }],
	['string', 'Hello World'],
	['number', 42],
	['boolean', true],
	['array', [{ hello: 'goodbye' }, { hello: 'world' }]],
];

test.each(cases)('%s', (_description, input) => {
	const serialized = serialize(input);

	expect(serialized).toBeInstanceOf(Uint8Array);

	const deserialized = deserialize(serialized);

	expect(deserialized).toEqual(input);
});
