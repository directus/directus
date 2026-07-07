import { describe, expect, test } from 'vitest';
import type { SchemaSnapshotOutput } from '../../src/index.js';
import { schemaDiff } from '../../src/index.js';
import type { TestSchema } from '../schema.js';

const snapshot: SchemaSnapshotOutput = {
	version: 1,
	directus: '10.0.0',
	vendor: 'sqlite',
	collections: [],
	fields: [],
	systemFields: [],
	relations: [],
};

describe('schemaDiff', () => {
	test('posts the snapshot with no params when no options are given', () => {
		const request = schemaDiff<TestSchema>(snapshot)();

		expect(request).toEqual({
			method: 'POST',
			path: '/schema/diff',
			params: {},
			body: JSON.stringify(snapshot),
		});
	});

	test('adds the force param when force is true', () => {
		const request = schemaDiff<TestSchema>(snapshot, { force: true })();

		expect(request.params).toEqual({ force: true });
	});

	test('omits the force param when force is false', () => {
		const request = schemaDiff<TestSchema>(snapshot, { force: false })();

		expect(request.params).toEqual({});
	});

	test('adds the mode param for merge mode', () => {
		const request = schemaDiff<TestSchema>(snapshot, { mode: 'merge' })();

		expect(request.params).toEqual({ mode: 'merge' });
	});

	test('omits the mode param for the default mirror mode', () => {
		const request = schemaDiff<TestSchema>(snapshot, { mode: 'mirror' })();

		expect(request.params).toEqual({});
	});

	test('combines the force and mode params', () => {
		const request = schemaDiff<TestSchema>(snapshot, { force: true, mode: 'merge' })();

		expect(request.params).toEqual({ force: true, mode: 'merge' });
	});
});
