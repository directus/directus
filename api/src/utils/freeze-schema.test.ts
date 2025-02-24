import { expect, test } from 'vitest';
import { freezeSchema } from './freeze-schema.js';

test('freeze emtpy schema', () => {
	const schema = freezeSchema({
		collections: {},
		relations: [],
	});

	expect(Object.isFrozen(schema)).toBe(true);

	let error;

	try {
		schema.collections['test'] = {} as any;
	} catch (err) {
		error = err;
	}

	expect(error).toBeInstanceOf(TypeError);
});

test('freeze schema with collection', () => {
	const schema = freezeSchema({
		collections: {
			test: {
				collection: 'test',
				fields: {},
			} as any,
		},
		relations: [],
	});

	expect(Object.isFrozen(schema.collections['test'])).toBe(true);

	let error;

	try {
		schema.collections['test']!.collection = 'changed';
	} catch (err) {
		error = err;
	}

	expect(error).toBeInstanceOf(TypeError);
});

test('freeze schema with collection and field', () => {
	const schema = freezeSchema({
		collections: {
			test: {
				collection: 'test',
				fields: {
					id: {
						field: 'id',
					},
				},
			} as any,
		},
		relations: [],
	});

	expect(Object.isFrozen(schema.collections['test']!.fields['id'])).toBe(true);

	let error;

	try {
		schema.collections['test']!.fields['id']!.field = 'changed';
	} catch (err) {
		error = err;
	}

	expect(error).toBeInstanceOf(TypeError);
});

test('freeze schema with relation', () => {
	const schema = freezeSchema({
		collections: {},
		relations: [
			{
				collection: 'test',
			} as any,
		],
	});

	expect(Object.isFrozen(schema.relations[0])).toBe(true);

	let error;

	try {
		schema.relations[0]!.collection = 'changed';
	} catch (err) {
		error = err;
	}

	expect(error).toBeInstanceOf(TypeError);
});

test('freeze schema with relation and schema', () => {
	const schema = freezeSchema({
		collections: {},
		relations: [
			{
				collection: 'test',
				schema: {
					column: 'test',
				},
			} as any,
		],
	});

	expect(Object.isFrozen(schema.relations[0]!.schema!)).toBe(true);

	let error;

	try {
		schema.relations[0]!.schema!.column = 'changed';
	} catch (err) {
		error = err;
	}

	expect(error).toBeInstanceOf(TypeError);
});
