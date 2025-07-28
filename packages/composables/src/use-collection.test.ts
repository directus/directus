import { beforeEach, describe, expect, test, vi } from 'vitest';

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
		sort_field: null,
		translations: null,
		unarchive_value: null,
		versioning: false,
	},
	schema: {
		name: 'articles',
		comment: null,
	},
};

const mockField = {
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
};

// Create mock stores
const mockCollectionsStore = {
	collections: [mockCollection],
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

describe('useCollection (simplified)', () => {
	beforeEach(() => {
		vi.clearAllMocks();

		// Set up mock implementations
		mockCollectionsStore.getCollection.mockImplementation((collection: string) => {
			return collection === 'articles' ? mockCollection : null;
		});

		mockFieldsStore.getFieldsForCollectionSorted.mockImplementation((collection: string) => {
			return collection === 'articles' ? [mockField] : [];
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
		expect(fields.value).toEqual([mockField]);
	});
});
