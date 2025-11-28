import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';

// Mock API
const mockApi = {
	get: vi.fn(),
};

vi.mock('@/api', () => ({
	default: {
		get: (...args: any[]) => mockApi.get(...args),
	},
}));

// Mock unexpectedError
vi.mock('@/utils/unexpected-error', () => ({
	unexpectedError: vi.fn(),
}));

import { useComparison } from '@/views/private/components/comparison/use-comparison';

// Mock Fields Store
const mockFieldsStore = {
	getFieldsForCollection: vi.fn(),
};

vi.mock('@/stores/fields', () => ({
	useFieldsStore: () => mockFieldsStore,
}));

// Tests

describe('useComparison', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockFieldsStore.getFieldsForCollection.mockImplementation(getFieldData);
	});

	describe('with visible user & date fields', () => {
		beforeEach(() => {
			vi.clearAllMocks();

			mockFieldsStore.getFieldsForCollection.mockImplementation(() =>
				getFieldData({ hideUserFields: false, hideDateFields: false }),
			);
		});

		it('should include "created_at" and "created_by" in revisionFields and comparisonFields', async () => {
			const testCase = getTestData('revision', {
				currentRevisionOverwrites: {
					data: {
						description: 'tets',
						created_at: '2025-10-29T19:00:00.000Z',
						created_by: 'other-user-id',
					},
					delta: {
						created_at: '2025-10-29T19:00:00.000Z',
						created_by: 'other-user-id',
					},
				},
			});

			mockApi.get.mockImplementation(testCase.mockApiGet);

			const { comparisonData, comparisonFields, fetchComparisonData, fetchUserUpdated, fetchBaseItemUserUpdated } =
				useComparison(testCase.comparisonOptions);

			await fetchComparisonData();
			await fetchUserUpdated();
			await fetchBaseItemUserUpdated();

			const revisionFieldsArray = Array.from(comparisonData.value?.revisionFields ?? []);
			expect(revisionFieldsArray).toEqual(expect.arrayContaining(['created_at', 'created_by']));

			const comparisonFieldsArray = Array.from(comparisonFields.value ?? []);
			expect(comparisonFieldsArray).toEqual(expect.arrayContaining(['created_at', 'created_by']));
		});

		it('should include "updated_at" and "updated_by" in revisionFields, but not in comparisonFields', async () => {
			const testCase = getTestData('revision', {
				currentRevisionOverwrites: {
					data: {
						updated_at: '2025-10-29T17:00:00.000Z',
						updated_by: 'other-user-id',
					},
					delta: {
						updated_at: '2025-10-29T17:00:00.000Z',
						updated_by: 'other-user-id',
					},
				},
			});

			mockApi.get.mockImplementation(testCase.mockApiGet);

			const { comparisonData, comparisonFields, fetchComparisonData, fetchUserUpdated, fetchBaseItemUserUpdated } =
				useComparison(testCase.comparisonOptions);

			await fetchComparisonData();
			await fetchUserUpdated();
			await fetchBaseItemUserUpdated();

			const revisionFieldsArray = Array.from(comparisonData.value?.revisionFields ?? []);
			expect(revisionFieldsArray).toEqual(expect.arrayContaining(['updated_at', 'updated_by']));

			const comparisonFieldsArray = Array.from(comparisonFields.value ?? []);
			expect(comparisonFieldsArray).not.toEqual(expect.arrayContaining(['updated_at', 'updated_by']));
		});
	});

	describe('with hidden user & date fields', () => {
		it('should not include "created_at" and "created_by" in revisionFields and comparisonFields', async () => {
			const testCase = getTestData('revision', {
				currentRevisionOverwrites: {
					data: {
						title: 'update',
						created_at: '2025-10-29T17:00:00.000Z',
						created_by: 'other-user-id',
					},
					delta: {
						title: 'update',
						created_at: '2025-10-29T17:00:00.000Z',
						created_by: 'other-user-id',
					},
				},
			});

			mockApi.get.mockImplementation(testCase.mockApiGet);

			const { comparisonData, comparisonFields, fetchComparisonData, fetchUserUpdated, fetchBaseItemUserUpdated } =
				useComparison(testCase.comparisonOptions);

			await fetchComparisonData();
			await fetchUserUpdated();
			await fetchBaseItemUserUpdated();

			const revisionFieldsArray = Array.from(comparisonData.value?.revisionFields ?? []);
			expect(revisionFieldsArray).not.toEqual(expect.arrayContaining(['created_at', 'created_by']));

			const comparisonFieldsArray = Array.from(comparisonFields.value ?? []);
			expect(comparisonFieldsArray).not.toEqual(expect.arrayContaining(['created_at', 'created_by']));
		});

		it('should not include "updated_at" and "updated_by" in revisionFields and comparisonFields', async () => {
			const testCase = getTestData('revision', {
				currentRevisionOverwrites: {
					data: {
						updated_at: '2025-10-29T17:00:00.000Z',
						updated_by: 'other-user-id',
					},
					delta: {
						updated_at: '2025-10-29T17:00:00.000Z',
						updated_by: 'other-user-id',
					},
				},
			});

			mockApi.get.mockImplementation(testCase.mockApiGet);

			const { comparisonData, comparisonFields, fetchComparisonData, fetchUserUpdated, fetchBaseItemUserUpdated } =
				useComparison(testCase.comparisonOptions);

			await fetchComparisonData();
			await fetchUserUpdated();
			await fetchBaseItemUserUpdated();

			const revisionFieldsArray = Array.from(comparisonData.value?.revisionFields ?? []);
			expect(revisionFieldsArray).not.toEqual(expect.arrayContaining(['updated_at', 'updated_by']));

			const comparisonFieldsArray = Array.from(comparisonFields.value ?? []);
			expect(comparisonFieldsArray).not.toEqual(expect.arrayContaining(['updated_at', 'updated_by']));
		});
	});

	describe('revision comparison', () => {
		it('should exclude all relational fields from revisionFields and comparisonFields', async () => {
			const testCase = getTestData('revision', {
				currentRevisionOverwrites: {
					data: {
						description: 'test',
						m2o: 1,
						o2m: 2,
						m2m: 3,
						m2a: 4,
					},
					delta: {
						description: 'test',
						m2o: 1,
						o2m: 2,
						m2m: 3,
						m2a: 4,
					},
				},
			});

			mockApi.get.mockImplementation(testCase.mockApiGet);

			const { comparisonData, comparisonFields, fetchComparisonData, fetchUserUpdated, fetchBaseItemUserUpdated } =
				useComparison(testCase.comparisonOptions);

			await fetchComparisonData();
			await fetchUserUpdated();
			await fetchBaseItemUserUpdated();

			const revisionFieldsArray = Array.from(comparisonData.value?.revisionFields ?? []);
			expect(revisionFieldsArray).not.toEqual(expect.arrayContaining(['m2o', 'o2m', 'm2m', 'm2a']));

			const comparisonFieldsArray = Array.from(comparisonFields.value ?? []);
			expect(comparisonFieldsArray).not.toEqual(expect.arrayContaining(['m2o', 'o2m', 'm2m', 'm2a']));
		});
	});

	describe('user updated', () => {
		const testCase = getTestData('version');
		mockApi.get.mockImplementation(testCase.mockApiGet);

		it('should fetch and set userUpdated and baseUserUpdated correctly', async () => {
			const { userUpdated, baseUserUpdated, fetchComparisonData, fetchUserUpdated, fetchBaseItemUserUpdated } =
				useComparison(testCase.comparisonOptions);

			await fetchComparisonData();
			await fetchUserUpdated();
			await fetchBaseItemUserUpdated();

			expect(userUpdated.value).toBeDefined();
			expect(baseUserUpdated.value).toBeDefined();
		});

		it('should fetch userUpdated correctly when date fields are excluded', async () => {
			mockFieldsStore.getFieldsForCollection.mockImplementation(() =>
				getFieldData({ includeDateFields: false, includeUserFields: false }),
			);

			const { userUpdated, baseUserUpdated, fetchComparisonData, fetchUserUpdated, fetchBaseItemUserUpdated } =
				useComparison(testCase.comparisonOptions);

			await fetchComparisonData();
			await fetchUserUpdated();
			await fetchBaseItemUserUpdated();

			expect(userUpdated.value).toBeDefined();
			expect(baseUserUpdated.value).toBeDefined();
		});

		it('should return null for baseUserUpdated when no activity is present', async () => {
			const testCaseNoActivity = getTestData('version', {
				latestMainRevisionActivityOverwrites: {},
			});

			mockApi.get.mockImplementation(testCaseNoActivity.mockApiGet);

			mockFieldsStore.getFieldsForCollection.mockImplementation(() =>
				getFieldData({ includeDateFields: false, includeUserFields: false }),
			);

			const { userUpdated, baseUserUpdated, fetchComparisonData, fetchUserUpdated, fetchBaseItemUserUpdated } =
				useComparison(testCaseNoActivity.comparisonOptions);

			await fetchComparisonData();
			await fetchUserUpdated();
			await fetchBaseItemUserUpdated();

			expect(userUpdated.value).toBeDefined();
			expect(baseUserUpdated.value).toBeNull();
		});
	});

	describe('normalizeVersionItem date and user selection', () => {
		it('should use date_updated and user_updated when user_updated exists', async () => {
			const testCase = getTestData('version', {
				currentVersionOverwrites: {
					date_created: '2025-10-29T09:00:00.000Z',
					date_updated: '2025-10-29T10:00:00.000Z',
					user_created: 'user-created-id',
					user_updated: 'user-updated-id',
				},
			});

			mockApi.get.mockImplementation(testCase.mockApiGet);

			const { normalizedData, fetchComparisonData } = useComparison(testCase.comparisonOptions);

			await fetchComparisonData();

			expect(normalizedData.value?.incoming?.date?.raw).toBe('2025-10-29T10:00:00.000Z');
			expect(normalizedData.value?.incoming?.user).toBe('user-updated-id');
		});

		it('should use date_created and user_created when user_updated does not exist', async () => {
			const testCase = getTestData('version', {
				currentVersionOverwrites: {
					date_created: '2025-10-29T09:00:00.000Z',
					date_updated: null,
					user_created: 'user-created-id',
					user_updated: null,
				},
			});

			mockApi.get.mockImplementation(testCase.mockApiGet);

			const { normalizedData, fetchComparisonData } = useComparison(testCase.comparisonOptions);

			await fetchComparisonData();

			expect(normalizedData.value?.incoming?.date?.raw).toBe('2025-10-29T09:00:00.000Z');
			expect(normalizedData.value?.incoming?.user).toBe('user-created-id');
		});
	});
});

function getTestData(mode: 'version' | 'revision' = 'version', overwrites: Record<string, any> = {}) {
	const {
		currentVersionOverwrites = {},
		currentRevisionOverwrites = {},
		mainItemOverwrites = {},
		versionCompareOverwrites = {},
		latestMainRevisionActivityOverwrites = null,
	} = overwrites;

	const collection = 'test_collection';
	const primaryKey = 1;
	const versionCompareHash = '2b0ca481b8b806ca320d628ce13c6b15c9bc4d09';

	const adminUser = {
		id: 'c42659fa-c936-4a06-9b99-ed9471a2d6df',
		email: 'admin@example.com',
		first_name: 'Admin',
		last_name: 'User',
	};

	const currentVersion = {
		id: 'a1b8e4d2-ca52-4f54-b0d9-6895c34efdd4',
		key: 'draft',
		name: 'Draft',
		collection,
		item: primaryKey,
		hash: versionCompareHash,
		date_created: '2025-10-29T09:00:00.000Z',
		date_updated: '2025-10-29T10:00:00.000Z',
		user_created: adminUser.id,
		user_updated: adminUser.id,
		delta: null,
		...currentVersionOverwrites,
	};

	const currentRevision = {
		id: 1234,
		collection: collection,
		item: primaryKey,
		data: {},
		delta: {},
		activity: {
			action: 'create',
			timestamp: '2025-10-29T10:00:00.000Z',
			user: adminUser,
		},
		...currentRevisionOverwrites,
	};

	const mainItem = {
		id: primaryKey,
		created_by: adminUser.id,
		created_at: '2025-10-29T08:00:00.000Z',
		updated_by: null,
		updated_at: null,
		title: 'Main title',
		description: null,
		hide_description: false,
		m2o: null,
		o2m_parent_id: null,
		o2m: [],
		m2m: [],
		m2a: [],
		...mainItemOverwrites,
	};

	const versionCompare = {
		outdated: false,
		mainHash: versionCompareHash,
		current: {
			id: primaryKey,
			updated_by: adminUser.id,
			updated_at: '2025-10-29T11:30:00.000Z',
			title: 'updated version',
		},
		main: mainItem,
		...versionCompareOverwrites,
	};

	const revisions = [currentRevision];

	const latestMainRevisionActivity = [
		{
			activity: latestMainRevisionActivityOverwrites ?? {
				timestamp: '2025-10-29T08:30:00.000Z',
				user: adminUser,
			},
		},
	];

	return {
		mockApiGet,
		comparisonOptions: {
			collection: ref(collection),
			primaryKey: ref(primaryKey),
			mode: ref(mode),
			currentVersion: ref(currentVersion),
			currentRevision: ref(currentRevision),
			revisions: ref(revisions),
		},
	};

	function mockApiGet(path: string) {
		if (path === `/versions/${currentVersion?.id ?? ''}/compare`) {
			return Promise.resolve({ data: { data: versionCompare } });
		}

		if (path === '/revisions') {
			return Promise.resolve({ data: { data: latestMainRevisionActivity } });
		}

		if (path === `/users/${adminUser.id}`) {
			return Promise.resolve({ data: { data: adminUser } });
		}

		if (path === `/items/${collection}/${primaryKey}`) {
			return Promise.resolve({ data: { data: mainItem } });
		}

		return Promise.reject(new Error(`Path "${path}" is not mocked in this test`));
	}
}

function getFieldData({
	hideUserFields = true,
	hideDateFields = true,
	includeDateFields = true,
	includeUserFields = true,
} = {}) {
	const collection = 'test_collection';

	return [
		{
			collection: collection,
			field: 'id',
			type: 'integer',
			schema: {
				name: 'id',
				table: collection,
				data_type: 'integer',
				default_value: null,
				max_length: null,
				numeric_precision: null,
				numeric_scale: null,
				is_generated: false,
				generation_expression: null,
				is_nullable: false,
				is_unique: false,
				is_indexed: false,
				is_primary_key: true,
				has_auto_increment: true,
				foreign_key_column: null,
				foreign_key_table: null,
			},
			meta: {
				id: 192,
				collection: collection,
				field: 'id',
				special: null,
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
				required: false,
				group: null,
				validation: null,
				validation_message: null,
			},
			name: 'ID',
		},
		...(includeDateFields
			? [
					{
						collection: collection,
						field: 'created_at',
						type: 'timestamp',
						schema: {
							name: 'created_at',
							table: collection,
							data_type: 'datetime',
							default_value: null,
							max_length: null,
							numeric_precision: null,
							numeric_scale: null,
							is_generated: false,
							generation_expression: null,
							is_nullable: true,
							is_unique: false,
							is_indexed: false,
							is_primary_key: false,
							has_auto_increment: false,
							foreign_key_column: null,
							foreign_key_table: null,
						},
						meta: {
							id: 194,
							collection: collection,
							field: 'created_at',
							special: ['date-created', 'cast-timestamp'],
							interface: 'datetime',
							options: null,
							display: 'datetime',
							display_options: {
								relative: true,
							},
							readonly: true,
							hidden: hideDateFields,
							sort: 3,
							width: 'half',
							translations: null,
							note: null,
							conditions: null,
							required: false,
							group: null,
							validation: null,
							validation_message: null,
						},
						name: 'Created At',
					},
					{
						collection: collection,
						field: 'updated_at',
						type: 'timestamp',
						schema: {
							name: 'updated_at',
							table: collection,
							data_type: 'datetime',
							default_value: null,
							max_length: null,
							numeric_precision: null,
							numeric_scale: null,
							is_generated: false,
							generation_expression: null,
							is_nullable: true,
							is_unique: false,
							is_indexed: false,
							is_primary_key: false,
							has_auto_increment: false,
							foreign_key_column: null,
							foreign_key_table: null,
						},
						meta: {
							id: 196,
							collection: collection,
							field: 'updated_at',
							special: ['date-updated', 'cast-timestamp'],
							interface: 'datetime',
							options: null,
							display: 'datetime',
							display_options: {
								relative: true,
							},
							readonly: true,
							hidden: hideDateFields,
							sort: 5,
							width: 'half',
							translations: null,
							note: null,
							conditions: null,
							required: false,
							group: null,
							validation: null,
							validation_message: null,
						},
						name: 'Updated At',
					},
				]
			: []),

		...(includeUserFields
			? [
					{
						collection: collection,
						field: 'created_by',
						type: 'string',
						schema: {
							name: 'created_by',
							table: collection,
							data_type: 'char',
							default_value: null,
							max_length: 36,
							numeric_precision: null,
							numeric_scale: null,
							is_generated: false,
							generation_expression: null,
							is_nullable: true,
							is_unique: false,
							is_indexed: false,
							is_primary_key: false,
							has_auto_increment: false,
							foreign_key_column: 'id',
							foreign_key_table: 'directus_users',
						},
						meta: {
							id: 193,
							collection: collection,
							field: 'created_by',
							special: ['user-created'],
							interface: 'select-dropdown-m2o',
							options: {
								template: '{{avatar}} {{first_name}} {{last_name}}',
							},
							display: 'user',
							display_options: null,
							readonly: true,
							hidden: hideUserFields,
							sort: 2,
							width: 'half',
							translations: null,
							note: null,
							conditions: null,
							required: false,
							group: null,
							validation: null,
							validation_message: null,
						},
						name: 'Created By',
					},
					{
						collection: collection,
						field: 'updated_by',
						type: 'string',
						schema: {
							name: 'updated_by',
							table: collection,
							data_type: 'char',
							default_value: null,
							max_length: 36,
							numeric_precision: null,
							numeric_scale: null,
							is_generated: false,
							generation_expression: null,
							is_nullable: true,
							is_unique: false,
							is_indexed: false,
							is_primary_key: false,
							has_auto_increment: false,
							foreign_key_column: 'id',
							foreign_key_table: 'directus_users',
						},
						meta: {
							id: 195,
							collection: collection,
							field: 'updated_by',
							special: ['user-updated'],
							interface: 'select-dropdown-m2o',
							options: {
								template: '{{avatar}} {{first_name}} {{last_name}}',
							},
							display: 'user',
							display_options: null,
							readonly: true,
							hidden: hideUserFields,
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
						name: 'Updated By',
					},
				]
			: []),
		{
			collection: collection,
			field: 'title',
			type: 'string',
			schema: {
				name: 'title',
				table: collection,
				data_type: 'varchar',
				default_value: null,
				max_length: 255,
				numeric_precision: null,
				numeric_scale: null,
				is_generated: false,
				generation_expression: null,
				is_nullable: true,
				is_unique: false,
				is_indexed: false,
				is_primary_key: false,
				has_auto_increment: false,
				foreign_key_column: null,
				foreign_key_table: null,
			},
			meta: {
				id: 197,
				collection: collection,
				field: 'title',
				special: null,
				interface: 'input',
				options: null,
				display: null,
				display_options: null,
				readonly: false,
				hidden: false,
				sort: 6,
				width: 'full',
				translations: null,
				note: null,
				conditions: null,
				required: false,
				group: null,
				validation: null,
				validation_message: null,
			},
			name: 'Title',
		},
		{
			collection: collection,
			field: 'description',
			type: 'text',
			schema: {
				name: 'description',
				table: collection,
				data_type: 'text',
				default_value: null,
				max_length: null,
				numeric_precision: null,
				numeric_scale: null,
				is_generated: false,
				generation_expression: null,
				is_nullable: true,
				is_unique: false,
				is_indexed: false,
				is_primary_key: false,
				has_auto_increment: false,
				foreign_key_column: null,
				foreign_key_table: null,
			},
			meta: {
				id: 198,
				collection: collection,
				field: 'description',
				special: null,
				interface: 'input-multiline',
				options: null,
				display: null,
				display_options: null,
				readonly: false,
				hidden: false,
				sort: 7,
				width: 'half',
				translations: null,
				note: null,
				conditions: [
					{
						name: 'Hide if toggle is enabled',
						rule: {
							_and: [
								{
									hide_description: {
										_eq: true,
									},
								},
							],
						},
						hidden: false,
					},
				],
				required: false,
				group: null,
				validation: null,
				validation_message: null,
			},
			name: 'Description',
		},
		{
			collection: collection,
			field: 'hide_description',
			type: 'boolean',
			schema: {
				name: 'hide_description',
				table: collection,
				data_type: 'boolean',
				default_value: false,
				max_length: null,
				numeric_precision: null,
				numeric_scale: null,
				is_generated: false,
				generation_expression: null,
				is_nullable: false,
				is_unique: false,
				is_indexed: false,
				is_primary_key: false,
				has_auto_increment: false,
				foreign_key_column: null,
				foreign_key_table: null,
			},
			meta: {
				id: 199,
				collection: collection,
				field: 'hide_description',
				special: ['cast-boolean'],
				interface: 'boolean',
				options: null,
				display: null,
				display_options: null,
				readonly: false,
				hidden: false,
				sort: 8,
				width: 'half',
				translations: null,
				note: null,
				conditions: null,
				required: false,
				group: null,
				validation: null,
				validation_message: null,
			},
			name: 'Hide Description',
		},
		{
			collection: collection,
			field: 'm2o',
			type: 'integer',
			schema: {
				name: 'm2o',
				table: collection,
				data_type: 'integer',
				default_value: null,
				max_length: null,
				numeric_precision: null,
				numeric_scale: null,
				is_generated: false,
				generation_expression: null,
				is_nullable: true,
				is_unique: false,
				is_indexed: false,
				is_primary_key: false,
				has_auto_increment: false,
				foreign_key_column: 'id',
				foreign_key_table: collection,
			},
			meta: {
				id: 200,
				collection: collection,
				field: 'm2o',
				special: ['m2o'],
				interface: 'select-dropdown-m2o',
				options: {
					template: '{{title}}',
				},
				display: null,
				display_options: null,
				readonly: false,
				hidden: false,
				sort: 9,
				width: 'full',
				translations: null,
				note: null,
				conditions: null,
				required: false,
				group: null,
				validation: null,
				validation_message: null,
			},
			name: 'M2O',
		},
		{
			collection: collection,
			field: 'o2m',
			type: 'alias',
			schema: null,
			meta: {
				id: 201,
				collection: collection,
				field: 'o2m',
				special: ['o2m'],
				interface: 'list-o2m',
				options: {
					sort: null,
					template: '{{title}}',
				},
				display: null,
				display_options: null,
				readonly: false,
				hidden: false,
				sort: 10,
				width: 'full',
				translations: null,
				note: null,
				conditions: null,
				required: false,
				group: null,
				validation: null,
				validation_message: null,
			},
			name: 'O2M',
		},
		{
			collection: collection,
			field: 'o2m_parent_id',
			type: 'integer',
			schema: {
				name: 'o2m_parent_id',
				table: collection,
				data_type: 'integer',
				default_value: null,
				max_length: null,
				numeric_precision: null,
				numeric_scale: null,
				is_generated: false,
				generation_expression: null,
				is_nullable: true,
				is_unique: false,
				is_indexed: false,
				is_primary_key: false,
				has_auto_increment: false,
				foreign_key_column: 'id',
				foreign_key_table: collection,
			},
			meta: {
				id: 202,
				collection: collection,
				field: 'o2m_parent_id',
				special: null,
				interface: 'select-dropdown-m2o',
				options: null,
				display: null,
				display_options: null,
				readonly: false,
				hidden: true,
				sort: 11,
				width: 'half',
				translations: null,
				note: null,
				conditions: null,
				required: false,
				group: null,
				validation: null,
				validation_message: null,
			},
			name: 'O2M Parent ID',
		},
		{
			collection: collection,
			field: 'm2m',
			type: 'alias',
			schema: null,
			meta: {
				id: 203,
				collection: collection,
				field: 'm2m',
				special: ['m2m'],
				interface: 'list-m2m',
				options: {
					layout: 'table',
					fields: [`${collection}_id.title`],
				},
				display: null,
				display_options: null,
				readonly: false,
				hidden: false,
				sort: 12,
				width: 'full',
				translations: null,
				note: null,
				conditions: null,
				required: false,
				group: null,
				validation: null,
				validation_message: null,
			},
			name: 'M2M',
		},
		{
			collection: collection,
			field: 'm2a',
			type: 'alias',
			schema: null,
			meta: {
				id: 207,
				collection: collection,
				field: 'm2a',
				special: ['m2a'],
				interface: 'list-m2a',
				options: null,
				display: null,
				display_options: null,
				readonly: false,
				hidden: false,
				sort: 13,
				width: 'full',
				translations: null,
				note: null,
				conditions: null,
				required: false,
				group: null,
				validation: null,
				validation_message: null,
			},
			name: 'M2A',
		},
	];
}
