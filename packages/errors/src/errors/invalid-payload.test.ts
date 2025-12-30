import type { InvalidPayloadErrorExtensions } from './invalid-payload.js';
import { messageConstructor } from './invalid-payload.js';
import { beforeEach, expect, test } from 'vitest';

let sample: InvalidPayloadErrorExtensions;

beforeEach(() => {
	sample = {
		reason: 'Test payload validation failed',
	};
});

test('Constructs message', () => {
	expect(messageConstructor(sample)).toBe(`Invalid payload. ${sample.reason}.`);
});
