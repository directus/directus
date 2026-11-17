import { beforeEach, expect, test } from 'vitest';
import type { LicenseInvalidErrorExtensions } from './license-invalid.js';
import { messageConstructor } from './license-invalid.js';

let sample: LicenseInvalidErrorExtensions;

beforeEach(() => {
	sample = {
		failure: 'expired',
		reason: 'The license expired on 2025-01-01',
	};
});

test('Constructs message', () => {
	expect(messageConstructor(sample)).toBe(`License key cannot be applied. ${sample.reason}`);
});
