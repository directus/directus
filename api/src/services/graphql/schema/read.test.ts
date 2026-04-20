import { GraphQLString } from 'graphql';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { getTypes } from './get-types.js';
import { getReadableTypes } from './read.js';

vi.mock('./get-types.js', () => ({ getTypes: vi.fn() }));
vi.mock('../resolvers/query.js', () => ({ resolveQuery: vi.fn() }));
vi.mock('../subscription.js', () => ({ createSubscriptionGenerator: vi.fn(() => vi.fn()) }));
vi.mock('../utils/dedupe-resolvers.js', () => ({ dedupeRelationalResolver: vi.fn((fn) => fn) }));

// ---------------------------------------------------------------------------
// Mock SchemaComposer
// ---------------------------------------------------------------------------
// graphql-compose's compiled CJS code uses require("graphql") while read.ts
// uses ESM imports, producing different class instances and failing instanceof
// checks in TypeMapper. We bypass this entirely by providing a lightweight
// mock that records createInputTC calls and returns fake ITCs.

interface MockITC {
	name: string;
	fields: Record<string, any>;
	hasField(name: string): boolean;
	getFieldTC(name: string): MockITC | undefined;
	getTypeName(): string;
	addFields(newFields: Record<string, any>): void;
	clone(newName: string): MockITC;
}

function makeMockITC(name: string, initialFields: Record<string, any> = {}): MockITC {
	const fields: Record<string, any> = { ...initialFields };

	const itc: MockITC = {
		name,
		fields,
		hasField: (fieldName) => fieldName in fields,
		// Field values may be stored as { type: MockITC } or directly as a MockITC.
		getFieldTC: (fieldName) => {
			const f = fields[fieldName];
			return f?.type ?? f;
		},
		getTypeName: () => name,
		getFields: () => fields,
		addFields: (newFields) => Object.assign(fields, newFields),
		clone: (newName) => makeMockITC(newName, { ...fields }),
	};

	return itc;
}

function makeMockSchemaComposer() {
	const inputTypes = new Map<string, MockITC>();

	const sc = {
		createInputTC: vi.fn(({ name, fields = {} }: { name: string; fields?: Record<string, any> }) => {
			const itc = makeMockITC(name, fields);
			inputTypes.set(name, itc);
			return itc;
		}),
		// getType() must return a real GraphQL type so GraphQLNonNull/GraphQLList
		// constructors in read.ts don't throw devAssert errors.
		createObjectTC: vi.fn(({ name }: { name: string }) => ({
			name,
			getType: vi.fn(() => GraphQLString),
			addResolver: vi.fn(),
			addFieldArgs: vi.fn(),
			addFields: vi.fn(),
		})),
		createEnumTC: vi.fn(({ name }: { name: string }) => ({ name, getType: vi.fn(() => ({})) })),
		Subscription: { addFields: vi.fn() },
		getITC(name: string) {
			const itc = inputTypes.get(name);
			if (!itc) throw new Error(`Input type "${name}" not found`);
			return itc;
		},
		has: (name: string) => inputTypes.has(name),
		inputTypes,
	};

	return sc;
}

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

const mockGql = { scope: 'items' } as any;
const mockInconsistentFields = { read: {}, create: {}, update: {}, delete: {} } as any;

function makeSchema(collections: Record<string, any>): any {
	return {
		read: { collections, relations: [] },
		create: { collections: {}, relations: [] },
		update: { collections: {}, relations: [] },
		delete: { collections: {}, relations: [] },
	};
}

function makeCollection(name: string, fields: Record<string, any>) {
	return { collection: name, singleton: false, fields };
}

function makeField(name: string, type: string, special: string[] = []) {
	return { field: name, type, special, note: null };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('getReadableTypes – json filter operator (Phase 1)', () => {
	let sc: ReturnType<typeof makeMockSchemaComposer>;

	beforeEach(() => {
		sc = makeMockSchemaComposer();

		vi.mocked(getTypes).mockImplementation((_sc: any, _scope: any, schema: any) => {
			const CollectionTypes: Record<string, any> = {};
			const VersionTypes: Record<string, any> = {};

			for (const name of Object.keys(schema.read.collections)) {
				CollectionTypes[name] = {
					name: `${name}_type`,
					getType: vi.fn(() => GraphQLString),
					addResolver: vi.fn(),
					addFieldArgs: vi.fn(),
					addFields: vi.fn(),
				};

				VersionTypes[name] = {
					name: `${name}_version`,
					getType: vi.fn(() => GraphQLString),
					addResolver: vi.fn(),
					addFieldArgs: vi.fn(),
					addFields: vi.fn(),
				};
			}

			return { CollectionTypes, VersionTypes };
		});
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	test('creates json_filter_operators input type with _json, _null, and _nnull fields', async () => {
		const schema = makeSchema({
			articles: makeCollection('articles', {
				metadata: makeField('metadata', 'json'),
			}),
		});

		await getReadableTypes(mockGql, sc as any, schema, mockInconsistentFields);

		const jsonFilterType = sc.inputTypes.get('json_filter_operators');
		expect(jsonFilterType).toBeDefined();
		expect(jsonFilterType!.hasField('_json')).toBe(true);
		expect(jsonFilterType!.hasField('_null')).toBe(true);
		expect(jsonFilterType!.hasField('_nnull')).toBe(true);
	});

	test('json field is mapped to json_filter_operators in the collection filter type', async () => {
		const schema = makeSchema({
			articles: makeCollection('articles', {
				metadata: makeField('metadata', 'json'),
			}),
		});

		const { ReadableCollectionFilterTypes } = await getReadableTypes(
			mockGql,
			sc as any,
			schema,
			mockInconsistentFields,
		);

		const filterType = ReadableCollectionFilterTypes['articles']!;
		expect(filterType.getFieldTC('metadata')?.getTypeName()).toBe('json_filter_operators');
	});

	test('json field also gets _func mapped to count_function_filter_operators', async () => {
		const schema = makeSchema({
			articles: makeCollection('articles', {
				metadata: makeField('metadata', 'json'),
			}),
		});

		const { ReadableCollectionFilterTypes } = await getReadableTypes(
			mockGql,
			sc as any,
			schema,
			mockInconsistentFields,
		);

		const filterType = ReadableCollectionFilterTypes['articles']!;
		expect(filterType.hasField('metadata_func')).toBe(true);
		expect(filterType.getFieldTC('metadata_func')?.getTypeName()).toBe('count_function_filter_operators');
	});

	test('alias field gets _func but is not remapped to json_filter_operators', async () => {
		const schema = makeSchema({
			articles: makeCollection('articles', {
				tags: makeField('tags', 'alias'),
			}),
		});

		const { ReadableCollectionFilterTypes } = await getReadableTypes(
			mockGql,
			sc as any,
			schema,
			mockInconsistentFields,
		);

		const filterType = ReadableCollectionFilterTypes['articles']!;
		expect(filterType.hasField('tags_func')).toBe(true);
		expect(filterType.getFieldTC('tags_func')?.getTypeName()).toBe('count_function_filter_operators');
		expect(filterType.getFieldTC('tags')?.getTypeName()).not.toBe('json_filter_operators');
	});
});
