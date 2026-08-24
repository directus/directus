// eslint-disable-next-line import/order
import { beforeEach, describe, expect, test, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Mocks — vi.hoisted() ensures the mock fn exists when the vi.mock factory
// runs (factories are hoisted to the top of the file by Vitest).
// ---------------------------------------------------------------------------

const { mockApplyFunctionToColumnName } = vi.hoisted(() => ({
	mockApplyFunctionToColumnName: vi.fn((col: string) => col),
}));

vi.mock('../../../database/run-ast/utils/apply-function-to-column-name.js', () => ({
	applyFunctionToColumnName: mockApplyFunctionToColumnName,
}));

// graphql-compose's compiled CJS code triggers instanceof checks against a
// different graphql instance than the ESM one, crashing TypeMapper. Stub the
// module so get-types.ts can load without that conflict.
vi.mock('graphql-compose', () => ({
	GraphQLJSON: { name: 'JSON' },
	ObjectTypeComposer: class {},
}));

// Static import — works with vi.mock hoisting (mocks are applied first).
import { getTypes } from './get-types.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Lightweight TC that records every field set on it. */
function makeTC(name: string, initialFields: Record<string, any> = {}) {
	const fields: Record<string, any> = { ...initialFields };

	return {
		name,
		getFields: () => fields,
		addFields: (f: Record<string, any>) => Object.assign(fields, f),
		clone: (n: string) => makeTC(n, { ...fields }),
	};
}

/**
 * Minimal SchemaComposer stand-in — captures ObjectTC definitions and returns
 * inspectable TC objects without invoking graphql-compose's TypeMapper.
 */
function makeSchemaComposer() {
	const tcs = new Map<string, ReturnType<typeof makeTC>>();

	return {
		tcs,
		createObjectTC({ name, fields = {} }: { name: string; fields?: Record<string, any> }) {
			const tc = makeTC(name, fields);
			tcs.set(name, tc);
			return tc;
		},
	};
}

function makeSchema(action: 'read' | 'create', collections: Record<string, any>) {
	const empty = { collections: {}, relations: [] };

	return {
		read: action === 'read' ? { collections, relations: [] } : empty,
		create: action === 'create' ? { collections, relations: [] } : empty,
		update: empty,
		delete: empty,
	};
}

function makeCollection(name: string, fields: Record<string, any>) {
	return { collection: name, primary: 'id', singleton: false, fields };
}

function makeField(name: string, type: string) {
	return { field: name, type, special: [], note: null, nullable: true, defaultValue: null };
}

const mockInconsistentFields = { read: {}, create: {}, update: {}, delete: {} } as any;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('getTypes – json() inside {field}_func (Phase 3)', () => {
	let sc: ReturnType<typeof makeSchemaComposer>;

	beforeEach(() => {
		vi.clearAllMocks();
		mockApplyFunctionToColumnName.mockImplementation((col: string) => col);
		sc = makeSchemaComposer();
	});

	test('json field gets a {field}_func entry in the read CollectionType', () => {
		const schema = makeSchema('read', {
			articles: makeCollection('articles', {
				id: makeField('id', 'integer'),
				metadata: makeField('metadata', 'json'),
			}),
		});

		const { CollectionTypes } = getTypes(sc as any, 'items', schema as any, mockInconsistentFields, 'read');

		expect(CollectionTypes['articles']!.getFields()).toHaveProperty('metadata_func');
	});

	test('{field}_func for a json field has a json sub-field with a path arg', () => {
		const schema = makeSchema('read', {
			articles: makeCollection('articles', {
				metadata: makeField('metadata', 'json'),
			}),
		});

		getTypes(sc as any, 'items', schema as any, mockInconsistentFields, 'read');

		const funcType = sc.tcs.get('articles_metadata_func');
		expect(funcType).toBeDefined();
		expect(funcType!.getFields()).toHaveProperty('json');
		expect(funcType!.getFields()['json'].args).toHaveProperty('path');
	});

	test('{field}_func json resolver calls applyFunctionToColumnName and returns the right value', () => {
		mockApplyFunctionToColumnName.mockReturnValue('metadata_color_json');

		const schema = makeSchema('read', {
			articles: makeCollection('articles', {
				metadata: makeField('metadata', 'json'),
			}),
		});

		getTypes(sc as any, 'items', schema as any, mockInconsistentFields, 'read');

		const funcType = sc.tcs.get('articles_metadata_func');
		const jsonSubField = funcType!.getFields()['json'] as any;
		const obj = { metadata_color_json: '#ff0000' };

		const result = jsonSubField!.resolve(obj, { path: 'color' }, undefined, undefined);

		expect(mockApplyFunctionToColumnName).toHaveBeenCalledWith('json(metadata, color)');
		expect(result).toBe('#ff0000');
	});

	test('{field}_func for a json field also has a count sub-field', () => {
		const schema = makeSchema('read', {
			articles: makeCollection('articles', {
				metadata: makeField('metadata', 'json'),
			}),
		});

		getTypes(sc as any, 'items', schema as any, mockInconsistentFields, 'read');

		const funcType = sc.tcs.get('articles_metadata_func');
		expect(funcType!.getFields()).toHaveProperty('count');
	});

	test('{field}_func count resolver reads the {field}_count key from obj', () => {
		const schema = makeSchema('read', {
			articles: makeCollection('articles', {
				metadata: makeField('metadata', 'json'),
			}),
		});

		getTypes(sc as any, 'items', schema as any, mockInconsistentFields, 'read');

		const funcType = sc.tcs.get('articles_metadata_func');
		const countSubField = funcType!.getFields()['count'] as any;
		const obj = { metadata_count: 42 };

		expect(countSubField.resolve(obj)).toBe(42);
	});

	test('{field}_func resolver passes obj through for json fields', () => {
		const schema = makeSchema('read', {
			articles: makeCollection('articles', {
				metadata: makeField('metadata', 'json'),
			}),
		});

		const { CollectionTypes } = getTypes(sc as any, 'items', schema as any, mockInconsistentFields, 'read');

		const funcField = CollectionTypes['articles']!.getFields()['metadata_func'] as any;
		const obj = { metadata_count: 3, some_other: 'x' };

		expect(funcField.resolve(obj)).toBe(obj);
	});

	test('alias field does NOT get a per-field json func type', () => {
		const schema = makeSchema('read', {
			articles: makeCollection('articles', {
				tags: makeField('tags', 'alias'),
			}),
		});

		getTypes(sc as any, 'items', schema as any, mockInconsistentFields, 'read');

		expect(sc.tcs.has('articles_tags_func')).toBe(false);
	});

	test('create action does NOT add {field}_func for json fields', () => {
		const schema = makeSchema('create', {
			articles: makeCollection('articles', {
				metadata: makeField('metadata', 'json'),
			}),
		});

		const { CollectionTypes } = getTypes(sc as any, 'items', schema as any, mockInconsistentFields, 'create');

		expect(CollectionTypes['articles']!.getFields()).not.toHaveProperty('metadata_func');
	});
});
