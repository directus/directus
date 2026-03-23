import { beforeEach, expect, test } from 'vitest';
import type { InvalidPayloadErrorExtensions } from './invalid-payload.js';
import { messageConstructor } from './invalid-payload.js';

let sample: InvalidPayloadErrorExtensions;

beforeEach(() => {
	sample = {
		reason: 'Test payload validation failed',
	};
});

test('Constructs message', () => {
	expect(messageConstructor(sample)).toBe(`Invalid payload. ${sample.reason}.`);
});
