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

function makeSchema(action: 'read' | 'create' | 'update', collections: Record<string, any>) {
	const empty = { collections: {}, relations: [] };

	return {
		read: action === 'read' ? { collections, relations: [] } : empty,
		create: action === 'create' ? { collections, relations: [] } : empty,
		update: action === 'update' ? { collections, relations: [] } : empty,
		delete: empty,
	};
}

function makeCollection(name: string, fields: Record<string, any>) {
	return { collection: name, primary: 'id', singleton: false, fields };
}

function makeField(name: string, type: string, overrides: Record<string, any> = {}) {
	return { field: name, type, special: [], note: null, nullable: true, defaultValue: null, ...overrides };
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

describe('getTypes – non-null marking (directus/directus#25888)', () => {
	type Action = 'read' | 'create' | 'update';

	function fieldType(
		action: Action,
		field: ReturnType<typeof makeField>,
		{ collection = 'articles', inconsistent = [] as readonly string[] } = {},
	) {
		const schema = makeSchema(action, {
			[collection]: makeCollection(collection, {
				id: makeField('id', 'integer', { nullable: false }),
				[field.field]: field,
			}),
		});

		const inconsistentFields = {
			read: { [collection]: inconsistent },
			create: { [collection]: inconsistent },
			update: { [collection]: inconsistent },
			delete: {},
		} as any;

		const { CollectionTypes } = getTypes(
			makeSchemaComposer() as any,
			'items',
			schema as any,
			inconsistentFields,
			action,
		);

		return String(CollectionTypes[collection]!.getFields()[field.field]!.type);
	}

	test.each([
		['read', 'NOT NULL with default', 'String!', 'string', { nullable: false, defaultValue: 'small' }],
		['read', 'NOT NULL without default', 'String!', 'string', { nullable: false }],
		['read', 'nullable with default', 'String', 'string', { defaultValue: 'small' }],
		['read', 'NOT NULL with false default', 'Boolean!', 'boolean', { nullable: false, defaultValue: false }],
		['read', 'NOT NULL generated', 'Date', 'timestamp', { nullable: false, special: ['date-created'] }],
		['read', 'NOT NULL inconsistent', 'String', 'string', { nullable: false }, { inconsistent: ['size'] }],
		['read', 'primary key', 'ID!', 'integer', { field: 'id', nullable: false }],
		[
			'read',
			'directus_permissions primary key',
			'ID',
			'integer',
			{ field: 'id', nullable: false },
			{ collection: 'directus_permissions' },
		],
		['create', 'NOT NULL with default', 'String', 'string', { nullable: false, defaultValue: 'small' }],
		['create', 'NOT NULL with empty string default', 'String', 'string', { nullable: false, defaultValue: '' }],
		['create', 'NOT NULL with false default', 'Boolean', 'boolean', { nullable: false, defaultValue: false }],
		['create', 'NOT NULL with 0 default', 'Int', 'integer', { nullable: false, defaultValue: 0 }],
		['create', 'NOT NULL without default', 'String!', 'string', { nullable: false }],
		['create', 'NOT NULL generated', 'Date', 'timestamp', { nullable: false, special: ['date-created'] }],
		['create', 'NOT NULL inconsistent', 'String', 'string', { nullable: false }, { inconsistent: ['size'] }],
		['create', 'nullable without default', 'String', 'string', {}],
		['create', 'primary key without default', 'ID!', 'integer', { field: 'id', nullable: false }],
		[
			'create',
			'auto increment primary key',
			'ID',
			'integer',
			{ field: 'id', nullable: false, defaultValue: 'AUTO_INCREMENT' },
		],
		['create', 'primary key with 0 default', 'ID', 'integer', { field: 'id', nullable: false, defaultValue: 0 }],
		['create', 'uuid primary key', 'ID', 'uuid', { field: 'id', nullable: false, special: ['uuid'] }],
		['update', 'NOT NULL with default', 'String', 'string', { nullable: false, defaultValue: 'small' }],
		['update', 'NOT NULL without default', 'String', 'string', { nullable: false }],
		['update', 'primary key', 'ID', 'integer', { field: 'id', nullable: false }],
	] as const)('%s: %s is %s', (action, _label, expected, type, overrides, options?) => {
		expect(fieldType(action, makeField('size', type, overrides), options)).toBe(expected);
	});
});
