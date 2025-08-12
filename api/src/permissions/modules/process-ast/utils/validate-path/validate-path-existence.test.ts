import { ForbiddenError } from '@directus/errors';
import { SchemaBuilder } from '@directus/schema-builder';
import { expect, test } from 'vitest';
import { validatePathExistence } from './validate-path-existence.js';

test('Throws if collection does not exist in the schema', () => {
	const schema = new SchemaBuilder().build();

	expect(() => validatePathExistence('test.path', 'test-collection', new Set(), schema)).toThrowError(ForbiddenError);
});

test('Throws if field is not present in the schema', () => {
	const schema = new SchemaBuilder()
		.collection('test-collection', (c) => {
			c.field('id').id();
		})
		.build();

	expect(() => validatePathExistence('test.path', 'test-collection', new Set(['test-field-a']), schema)).toThrowError(
		ForbiddenError,
	);
});

test('Throws if fields are not present in the schema', () => {
	const schema = new SchemaBuilder()
		.collection('test-collection', (c) => {
			c.field('id').id();
		})
		.build();

	expect(() =>
		validatePathExistence('test.path', 'test-collection', new Set(['test-field-a', 'test-field-b']), schema),
	).toThrowError(ForbiddenError);
});

test('Returns without throwing an error if the field is present in the schema', () => {
	const schema = new SchemaBuilder()
		.collection('test-collection', (c) => {
			c.field('test-field-a').id();
		})
		.build();

	expect(() => validatePathExistence('test.path', 'test-collection', new Set(['test-field-a']), schema)).not.toThrow();
});

test('Allows synthetic fields (starting with $) to pass validation', () => {
	const schema = new SchemaBuilder()
		.collection('test-collection', (c) => {
			c.field('id').id();
		})
		.build();

	expect(() => validatePathExistence('test.path', 'test-collection', new Set(['$thumbnail']), schema)).not.toThrow();
});

test('Allows multiple synthetic fields to pass validation', () => {
	const schema = new SchemaBuilder()
		.collection('test-collection', (c) => {
			c.field('id').id();
		})
		.build();

	expect(() => validatePathExistence('test.path', 'test-collection', new Set(['$thumbnail', '$preview']), schema)).not.toThrow();
});

test('Allows mix of real and synthetic fields to pass validation', () => {
	const schema = new SchemaBuilder()
		.collection('test-collection', (c) => {
			c.field('id').id();
			c.field('title').string();
		})
		.build();

	expect(() => validatePathExistence('test.path', 'test-collection', new Set(['id', 'title', '$thumbnail']), schema)).not.toThrow();
});

test('Throws if mix contains non-existent regular field but allows synthetic fields', () => {
	const schema = new SchemaBuilder()
		.collection('test-collection', (c) => {
			c.field('id').id();
		})
		.build();

	expect(() => validatePathExistence('test.path', 'test-collection', new Set(['non-existent', '$thumbnail']), schema)).toThrowError(
		ForbiddenError,
	);
});
