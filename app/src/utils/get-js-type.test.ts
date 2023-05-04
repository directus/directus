import { test, expect } from 'vitest';
import { Field } from '@directus/types';
import { getJSType } from './get-js-type';

test('Returns object for relational fields', () => {
	const relationTypes = ['m2o', 'o2m', 'm2m', 'm2a', 'files', 'translations'];

	for (const special of relationTypes) {
		expect(
			getJSType({
				name: 'test',
				collection: 'test',
				field: 'test',
				type: 'alias',
				meta: {
					special: [special],
				},
			} as Field)
		).toBe('object');
	}
});

test('Returns number for numeric fields', () => {
	const numericTypes = ['bigInteger', 'integer', 'float', 'decimal'];

	for (const fieldType of numericTypes) {
		expect(
			getJSType({
				name: 'test',
				collection: 'test',
				field: 'test',
				type: fieldType,
			} as Field)
		).toBe('number');
	}
});

test('Returns string for string fields', () => {
	const stringTypes = ['string', 'text', 'uuid', 'hash'];

	for (const fieldType of stringTypes) {
		expect(
			getJSType({
				name: 'test',
				collection: 'test',
				field: 'test',
				type: fieldType,
			} as Field)
		).toBe('string');
	}
});

test('Returns boolean for boolean fields', () => {
	const booleanTypes = ['boolean'];

	for (const fieldType of booleanTypes) {
		expect(
			getJSType({
				name: 'test',
				collection: 'test',
				field: 'test',
				type: fieldType,
			} as Field)
		).toBe('boolean');
	}
});

test('Returns string for datetime fields', () => {
	const dateTypes = ['time', 'timestamp', 'date', 'dateTime'];

	for (const fieldType of dateTypes) {
		expect(
			getJSType({
				name: 'test',
				collection: 'test',
				field: 'test',
				type: fieldType,
			} as Field)
		).toBe('string');
	}
});

test('Returns object for json and csv fields', () => {
	const objectTypes = ['json', 'csv'];

	for (const fieldType of objectTypes) {
		expect(
			getJSType({
				name: 'test',
				collection: 'test',
				field: 'test',
				type: fieldType,
			} as Field)
		).toBe('object');
	}
});

test('Returns object for geometry fields', () => {
	const geometryTypes = ['geometryPoint', 'geometryPolygon', 'geometryLineString'];

	for (const fieldType of geometryTypes) {
		expect(
			getJSType({
				name: 'test',
				collection: 'test',
				field: 'test',
				type: fieldType,
			} as Field)
		).toBe('object');
	}
});

test('Returns undefined as fallback', () => {
	const errorTypes = ['non-existent', 'should also error', '🦄'];

	for (const fieldType of errorTypes) {
		expect(
			getJSType({
				name: 'test',
				collection: 'test',
				field: 'test',
				type: fieldType,
			} as Field)
		).toBe('undefined');
	}
});
