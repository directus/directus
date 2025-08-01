import { beforeEach, describe, expect, test, vi } from 'vitest';
import { ref } from 'vue';

// Create a simplified test to verify our mocking approach works

// Mock data
const mockCollection = {
	collection: 'articles',
	name: 'Articles',
	icon: 'article',
	type: 'table',
	color: null,
	meta: {
		accountability: 'all',
		archive_app_filter: true,
		archive_field: null,
		archive_value: null,
		collapse: 'open',
		collection: 'articles',
		color: null,
		display_template: null,
		group: null,
		hidden: false,
		icon: 'article',
		item_duplication_fields: null,
		name: 'Articles',
		note: null,
		preview_url: null,
		singleton: false,
		sort: null,
		sort_field: 'sort',
		translations: null,
		unarchive_value: null,
		versioning: false,
	},
	schema: {
		name: 'articles',
		comment: null,
	},
};

const mockSingletonCollection = {
	collection: 'settings',
	name: 'Settings',
	icon: 'settings',
	type: 'table',
	color: null,
	meta: {
		accountability: 'activity',
		archive_app_filter: true,
		archive_field: null,
		archive_value: null,
		collapse: 'open',
		collection: 'settings',
		color: null,
		display_template: null,
		group: null,
		hidden: false,
		icon: 'settings',
		item_duplication_fields: null,
		name: 'Settings',
		note: null,
		preview_url: null,
		singleton: true,
		sort: null,
		sort_field: null,
		translations: null,
		unarchive_value: null,
		versioning: false,
	},
	schema: {
		name: 'settings',
		comment: null,
	},
};

const mockFields = [
	{
		collection: 'articles',
		field: 'id',
		name: 'ID',
		type: 'integer',
		schema: {
			name: 'id',
			table: 'articles',
			data_type: 'integer',
			default_value: "nextval('articles_id_seq'::regclass)",
			max_length: null,
			numeric_precision: 32,
			numeric_scale: 0,
			is_nullable: false,
			is_unique: false,
			is_primary_key: true,
			has_auto_increment: true,
			foreign_key_schema: null,
			foreign_key_table: null,
			foreign_key_column: null,
			comment: null,
		},
		meta: {
			id: 1,
			collection: 'articles',
			field: 'id',
			special: ['primary-key', 'auto-increment'],
			interface: 'input',
			options: null,
			display: null,
			display_options: null,
			readonly: true,
			hidden: true,
			sort: 1,
			width: 'full',
			translations: null,
			note: null,
			conditions: null,
			required: true,
			group: null,
			validation: null,
			validation_message: null,
		},
	},
	{
		collection: 'articles',
		field: 'title',
		name: 'Title',
		type: 'string',
		schema: {
			name: 'title',
			table: 'articles',
			data_type: 'varchar',
			default_value: 'Untitled Article',
			max_length: 255,
			numeric_precision: null,
			numeric_scale: null,
			is_nullable: true,
			is_unique: false,
			is_primary_key: false,
			has_auto_increment: false,
			foreign_key_schema: null,
			foreign_key_table: null,
			foreign_key_column: null,
			comment: null,
		},
		meta: {
			id: 2,
			collection: 'articles',
			field: 'title',
			special: null,
			interface: 'input',
			options: null,
			display: null,
			display_options: null,
			readonly: false,
			hidden: false,
			sort: 2,
			width: 'full',
			translations: null,
			note: null,
			conditions: null,
			required: true,
			group: null,
			validation: null,
			validation_message: null,
		},
	},
	{
		collection: 'articles',
		field: 'sort',
		name: 'Sort',
		type: 'integer',
		schema: {
			name: 'sort',
			table: 'articles',
			data_type: 'integer',
			default_value: null,
			max_length: null,
			numeric_precision: 32,
			numeric_scale: 0,
			is_nullable: true,
			is_unique: false,
			is_primary_key: false,
			has_auto_increment: false,
			foreign_key_schema: null,
			foreign_key_table: null,
			foreign_key_column: null,
			comment: null,
		},
		meta: {
			id: 3,
			collection: 'articles',
			field: 'sort',
			special: null,
			interface: 'input',
			options: null,
			display: null,
			display_options: null,
			readonly: false,
			hidden: false,
			sort: 3,
			width: 'full',
			translations: null,
			note: null,
			conditions: null,
			required: false,
			group: null,
			validation: null,
			validation_message: null,
		},
	},
	{
		collection: 'articles',
		field: 'user_created',
		name: 'Created By',
		type: 'uuid',
		schema: {
			name: 'user_created',
			table: 'articles',
			data_type: 'uuid',
			default_value: null,
			max_length: null,
			numeric_precision: null,
			numeric_scale: null,
			is_nullable: true,
			is_unique: false,
			is_primary_key: false,
			has_auto_increment: false,
			foreign_key_schema: null,
			foreign_key_table: null,
			foreign_key_column: null,
			comment: null,
		},
		meta: {
			id: 4,
			collection: 'articles',
			field: 'user_created',
			special: ['user_created'],
			interface: 'select-dropdown-m2o',
			options: null,
			display: 'user',
			display_options: null,
			readonly: true,
			hidden: true,
			sort: 4,
			width: 'half',
			translations: null,
			note: null,
			conditions: null,
			required: false,
			group: null,
			validation: null,
			validation_message: null,
		},
	},
];

// Create mock stores
const mockCollectionsStore = {
	collections: [mockCollection, mockSingletonCollection],
	getCollection: vi.fn(),
};

const mockFieldsStore = {
	getFieldsForCollection: vi.fn(),
	getFieldsForCollectionSorted: vi.fn(),
};

// Mock useStores to return our mock stores
vi.mock('./use-system', () => ({
	useStores: () => ({
		useCollectionsStore: () => mockCollectionsStore,
		useFieldsStore: () => mockFieldsStore,
	}),
}));

// Import the function after mocking
import { useCollection } from './use-collection';

describe('useCollection', () => {
	beforeEach(() => {
		vi.clearAllMocks();

		// Set up mock implementations
		mockCollectionsStore.getCollection.mockImplementation((collection: string) => {
			if (collection === 'articles') return mockCollection;
			if (collection === 'settings') return mockSingletonCollection;
			return null;
		});

		mockFieldsStore.getFieldsForCollectionSorted.mockImplementation((collection: string) => {
			if (collection === 'articles') return mockFields;
			if (collection === 'settings') return [];
			return [];
		});

		mockFieldsStore.getFieldsForCollection.mockImplementation((collection: string) => {
			if (collection === 'articles') return mockFields;
			if (collection === 'settings') return [];
			return [];
		});
	});

	test('should return collection info for valid collection', () => {
		const { info } = useCollection('articles');
		expect(info.value).toEqual(mockCollection);
	});

	test('should return null for invalid collection', () => {
		const { info } = useCollection('invalid');
		expect(info.value).toBeNull();
	});

	test('should return fields for valid collection', () => {
		const { fields } = useCollection('articles');
		expect(fields.value).toEqual(mockFields);
	});

	test('should return defaults for collection', () => {
		const { defaults } = useCollection('articles');

		expect(defaults.value).toEqual({
			id: "nextval('articles_id_seq'::regclass)",
			title: 'Untitled Article',
			sort: null,
			user_created: null,
		});
	});

	test('should return primary key field', () => {
		const { primaryKeyField } = useCollection('articles');
		expect(primaryKeyField.value).toEqual(mockFields[0]);
	});

	test('should return null when no primary key field exists', () => {
		const { primaryKeyField } = useCollection('settings');
		expect(primaryKeyField.value).toBeNull();
	});

	test('should return user created field', () => {
		const { userCreatedField } = useCollection('articles');
		expect(userCreatedField.value).toEqual(mockFields[3]);
	});

	test('should return sort field', () => {
		const { sortField } = useCollection('articles');
		expect(sortField.value).toBe('sort');
	});

	test('should return false for isSingleton when collection is not singleton', () => {
		const { isSingleton } = useCollection('articles');
		expect(isSingleton.value).toBe(false);
	});

	test('should return true for isSingleton when collection is singleton', () => {
		const { isSingleton } = useCollection('settings');
		expect(isSingleton.value).toBe(true);
	});

	test('should return accountability scope', () => {
		const { accountabilityScope } = useCollection('articles');
		expect(accountabilityScope.value).toBe('all');
	});

	test('should work with reactive collection reference', () => {
		const collectionRef = ref('articles');
		const { info, fields } = useCollection(collectionRef);

		expect(info.value).toEqual(mockCollection);
		expect(fields.value).toEqual(mockFields);
	});

	test('should return empty array for fields when collection is null', () => {
		const collectionRef = ref<string | null>(null);
		const { fields } = useCollection(collectionRef);

		expect(fields.value).toEqual([]);
	});

	test('should return empty defaults when fields is empty', () => {
		const { defaults } = useCollection('settings');

		expect(defaults.value).toEqual({});
	});

	test('should return null for userCreatedField when fields is null', () => {
		// Create a mock that returns null for fields
		mockFieldsStore.getFieldsForCollectionSorted.mockImplementationOnce(() => null as any);

		const { userCreatedField } = useCollection('articles');

		expect(userCreatedField.value).toBeNull();
	});

	test('should return null for sortField when collection has no meta', () => {
		const collectionWithoutMeta = {
			...mockCollection,
			meta: null,
		};

		mockCollectionsStore.getCollection.mockReturnValueOnce(collectionWithoutMeta);

		const { sortField } = useCollection('test-collection');

		expect(sortField.value).toBeNull();
	});

	test('should return null for sortField when collection meta has no sort_field', () => {
		const collectionWithoutSortField = {
			...mockCollection,
			meta: {
				...mockCollection.meta,
				sort_field: null,
			},
		};

		mockCollectionsStore.getCollection.mockReturnValueOnce(collectionWithoutSortField);

		const { sortField } = useCollection('test-collection');

		expect(sortField.value).toBeNull();
	});

	test('should return null for accountabilityScope when collection info is null', () => {
		const { accountabilityScope } = useCollection('nonexistent');

		expect(accountabilityScope.value).toBeNull();
	});

	test('should return null for accountabilityScope when collection has no meta', () => {
		const collectionWithoutMeta = {
			...mockCollection,
			meta: null,
		};

		mockCollectionsStore.getCollection.mockReturnValueOnce(collectionWithoutMeta);

		const { accountabilityScope } = useCollection('test-collection');

		expect(accountabilityScope.value).toBeNull();
	});

	test('should return empty defaults when fields.value is falsy', () => {
		// Mock fields to be null/undefined
		mockFieldsStore.getFieldsForCollectionSorted.mockReturnValueOnce(null as any);

		const { defaults } = useCollection('test-collection');

		expect(defaults.value).toEqual({});
	});
});
