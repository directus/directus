import { describe, expect, test } from 'vitest';
import { unwrapDataEnvelope } from './schema.js';

describe('unwrapDataEnvelope', () => {
	test('returns raw snapshot object directly when not wrapped in envelope', () => {
		const rawSnapshot = {
			version: 1,
			directus: '12.2.0',
			vendor: 'sqlite',
			collections: [],
			fields: [],
			relations: [],
		};

		expect(unwrapDataEnvelope(rawSnapshot)).toEqual(rawSnapshot);
	});

	test('unwraps payload when object is wrapped in standard { data: payload } API envelope', () => {
		const rawSnapshot = {
			version: 1,
			directus: '12.2.0',
			vendor: 'sqlite',
			collections: [],
			fields: [],
			relations: [],
		};

		const wrappedEnvelope = {
			data: rawSnapshot,
		};

		expect(unwrapDataEnvelope(wrappedEnvelope)).toEqual(rawSnapshot);
	});

	test('unwraps diff payload when wrapped in standard { data: payload } API envelope', () => {
		const rawDiff = {
			hash: 'abc123hash',
			diff: {
				collections: [],
				fields: [],
				systemFields: [],
				relations: [],
			},
		};

		const wrappedDiffEnvelope = {
			data: rawDiff,
		};

		expect(unwrapDataEnvelope(wrappedDiffEnvelope)).toEqual(rawDiff);
	});

	test('does not unwrap when object has other keys alongside data', () => {
		const multiKeyObject = {
			data: { version: 1 },
			otherKey: 'value',
		};

		expect(unwrapDataEnvelope(multiKeyObject as any)).toEqual(multiKeyObject);
	});

	test('returns body as is when data is null or non-object', () => {
		const primitiveEnvelope = {
			data: 'string-payload',
		};

		expect(unwrapDataEnvelope(primitiveEnvelope as any)).toEqual(primitiveEnvelope);
	});
});
