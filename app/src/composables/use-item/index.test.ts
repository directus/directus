import { useCollection } from '@directus/composables';
import { AppCollection, Field } from '@directus/types';
import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { computed, ref } from 'vue';
import { useItem } from '.';
import { usePermissions } from '@/composables/use-permissions';
import sdk from '@/sdk';
import { applyConditions } from '@/utils/apply-conditions';

/**
 * Helper function to create field meta with default values
 * @param fieldMeta - Partial field meta properties to override defaults
 * @returns A complete field meta object with all required properties
 */
function createMockFieldMeta(fieldMeta: Partial<Field['meta']> = {}) {
	return {
		id: 1,
		collection: 'test',
		field: 'test_field',
		special: null,
		interface: null,
		options: null,
		display: null,
		display_options: null,
		readonly: false,
		hidden: false,
		sort: null,
		width: 'full',
		group: null,
		translations: null,
		required: false,
		note: null,
		conditions: null,
		validation: null,
		validation_message: null,
		...fieldMeta,
	} as Field['meta'];
}

vi.mock('@/utils/notify', () => ({
	notify: vi.fn(),
}));

vi.mock('@/sdk', async () => {
	const { mockSdk } = await import('@/test-utils/sdk');
	return mockSdk(({ path }) => {
		let payload: Record<string, unknown> = { id: 1 };

		if (path === '/graphql') {
			payload = {
				item: payload,
			};
		}

		return Promise.resolve(payload);
	});
});

vi.mock('@directus/composables');

vi.mock('@/utils/apply-conditions', () => ({
	applyConditions: vi.fn(),
}));

vi.mock('@/composables/use-permissions', () => ({
	usePermissions: vi.fn(() => ({
		itemPermissions: {
			fields: computed(() => []),
			loading: computed(() => false),
			refresh: vi.fn(),
		},
	})),
}));

vi.mock('@/utils/validate-item', () => ({
	validateItem: vi.fn(() => []),
}));

vi.mock('@/composables/use-nested-validation', () => ({
	useNestedValidation: vi.fn(() => ({
		nestedValidationErrors: computed(() => []),
	})),
}));

beforeEach(() => {
	setActivePinia(
		createTestingPinia({
			createSpy: vi.fn,
			stubActions: false,
		}),
	);
});

afterEach(() => {
	vi.clearAllMocks();
});

describe('Save As Copy', () => {
	const mockCollection = {
		collection: 'test',
	} as AppCollection;

	test('should use graphql to fetch existing item', async () => {
		const mockPrimaryKeyFieldName = 'id';

		const sdkSpy = vi.spyOn(sdk, 'request');

		const mockPrimaryKeyField = {
			field: mockPrimaryKeyFieldName,
		} as Field;

		const mockFields = [mockPrimaryKeyField] as Field[];

		vi.mocked(useCollection).mockReturnValue({
			info: computed(() => mockCollection),
			primaryKeyField: computed(() => mockPrimaryKeyField),
			fields: computed(() => mockFields),
		} as any);

		const { saveAsCopy } = useItem(ref('test'), ref(1));

		await saveAsCopy();

		expect(sdkSpy.mock.calls[1]?.[0]()).toEqual({
			path: '/graphql',
			body: { query: 'query { item: test_by_id (id: 1) }' },
			method: 'POST',
		});
	});

	test('should keep manual primary key', async () => {
		const mockPrimaryKeyFieldName = 'id';

		const sdkSpy = vi.spyOn(sdk, 'request');

		const mockPrimaryKeyField = {
			collection: 'test',
			field: mockPrimaryKeyFieldName,
		} as Field;

		const mockFields = [mockPrimaryKeyField] as Field[];

		vi.mocked(useCollection).mockReturnValue({
			info: computed(() => mockCollection),
			primaryKeyField: computed(() => mockPrimaryKeyField),
			fields: computed(() => mockFields),
		} as any);

		const { saveAsCopy } = useItem(ref('test'), ref(1));

		await saveAsCopy();

		expect(sdkSpy.mock.lastCall?.[0]()).toEqual(expect.objectContaining({ body: { [mockPrimaryKeyFieldName]: 1 } }));
	});

	test('should omit auto incremented primary key', async () => {
		const mockPrimaryKeyFieldName = 'id';

		const sdkSpy = vi.spyOn(sdk, 'request');

		const mockPrimaryKeyField = {
			field: mockPrimaryKeyFieldName,
			schema: {
				has_auto_increment: true,
			},
		} as Field;

		const mockFields = [mockPrimaryKeyField] as Field[];

		vi.mocked(useCollection).mockReturnValue({
			info: computed(() => mockCollection),
			primaryKeyField: computed(() => mockPrimaryKeyField),
			fields: computed(() => mockFields),
		} as any);

		const { saveAsCopy } = useItem(ref('test'), ref(1));

		await saveAsCopy();

		expect(sdkSpy.mock.lastCall?.[0]()).toEqual(expect.objectContaining({ body: {} }));
	});

	test('should omit special uuid primary key', async () => {
		const mockPrimaryKeyFieldName = 'id';
		const sdkSpy = vi.spyOn(sdk, 'request');

		const mockPrimaryKeyField = {
			field: mockPrimaryKeyFieldName,
			meta: {
				special: ['uuid'],
			},
		} as Field;

		const mockFields = [mockPrimaryKeyField] as Field[];

		vi.mocked(useCollection).mockReturnValue({
			info: computed(() => mockCollection),
			primaryKeyField: computed(() => mockPrimaryKeyField),
			fields: computed(() => mockFields),
		} as any);

		const { saveAsCopy } = useItem(ref('test'), ref(1));

		await saveAsCopy();

		expect(sdkSpy.mock.lastCall?.[0]()).toEqual(expect.objectContaining({ body: {} }));
	});
});

describe('Clear Hidden Fields Condition', () => {
	const mockCollection = {
		collection: 'test',
	} as AppCollection;

	const mockPrimaryKeyField = {
		field: 'id',
	} as Field;

	test('should clear field when condition has clear_hidden_value_on_save set to true', async () => {
		const mockField = {
			field: 'status',
			meta: createMockFieldMeta({
				field: 'status',
				hidden: false,
				conditions: [
					{
						name: 'hidden_when_draft',
						rule: { status: { _eq: 'draft' } },
						hidden: true,
						clear_hidden_value_on_save: true,
					},
				],
			}),
			schema: {
				default_value: 'published',
			},
		} as Field;

		const mockFields = [mockField] as Field[];

		const sdkSpy = vi.spyOn(sdk, 'request').mockResolvedValue({
			id: 1,
			name: 'Test Item',
		});

		vi.mocked(useCollection).mockReturnValue({
			info: computed(() => mockCollection),
			primaryKeyField: computed(() => mockPrimaryKeyField),
			fields: computed(() => mockFields),
		} as any);

		vi.mocked(usePermissions).mockReturnValue({
			itemPermissions: {
				fields: computed(() => mockFields),
				loading: computed(() => false),
				refresh: vi.fn(),
			},
		} as any);

		vi.mocked(applyConditions).mockReturnValue({
			...mockField,
			meta: {
				...mockField.meta,
				id: 1,
				hidden: true,
				clear_hidden_value_on_save: true,
			},
		} as any);

		const { save, edits } = useItem(ref('test'), ref(1));

		edits.value = { status: 'draft' };

		await save();

		expect(sdkSpy.mock.lastCall?.[0]()).toEqual({
			path: '/items/test/1',
			method: 'PATCH',
			body: { status: 'published' },
		});
	});

	test('should not clear field when condition does not have clear_hidden_value_on_save set', async () => {
		const mockField = {
			field: 'status',
			meta: createMockFieldMeta({
				field: 'status',
				hidden: false,
				conditions: [
					{
						name: 'hidden_when_draft',
						rule: { status: { _eq: 'draft' } },
						hidden: true,
						clear_hidden_value_on_save: false,
					},
				],
			}),
			schema: {
				default_value: 'published',
			},
		} as Field;

		const mockFields = [mockField] as Field[];

		const sdkSpy = vi.spyOn(sdk, 'request').mockResolvedValue({
			id: 1,
			name: 'Test Item',
		});

		vi.mocked(useCollection).mockReturnValue({
			info: computed(() => mockCollection),
			primaryKeyField: computed(() => mockPrimaryKeyField),
			fields: computed(() => mockFields),
		} as any);

		vi.mocked(applyConditions).mockReturnValue({
			...mockField,
			meta: {
				...mockField.meta,
				hidden: true,
				clear_hidden_value_on_save: false,
			},
		} as any);

		const { save, edits } = useItem(ref('test'), ref(1));

		edits.value = { status: 'draft' };

		await save();

		expect(sdkSpy.mock.lastCall?.[0]()).toEqual({
			path: '/items/test/1',
			method: 'PATCH',
			body: { status: 'draft' },
		});
	});

	test('should not clear field when field is statically hidden (no conditions)', async () => {
		const mockField = {
			field: 'status',
			meta: createMockFieldMeta({
				field: 'status',
				hidden: true,
			}),
			schema: {
				default_value: 'published',
			},
		} as Field;

		const mockFields = [mockField] as Field[];

		const sdkSpy = vi.spyOn(sdk, 'request').mockResolvedValue({
			id: 1,
			name: 'Test Item',
		});

		vi.mocked(useCollection).mockReturnValue({
			info: computed(() => mockCollection),
			primaryKeyField: computed(() => mockPrimaryKeyField),
			fields: computed(() => mockFields),
		} as any);

		const { save, edits } = useItem(ref('test'), ref(1));

		edits.value = { status: 'draft' };

		await save();

		expect(sdkSpy.mock.lastCall?.[0]()).toEqual({
			path: '/items/test/1',
			method: 'PATCH',
			body: { status: 'draft' },
		});
	});

	test('should clear field to null when no default value is set', async () => {
		const mockField = {
			field: 'status',
			meta: createMockFieldMeta({
				hidden: false,
				conditions: [
					{
						name: 'hidden_when_draft',
						rule: { status: { _eq: 'draft' } },
						hidden: true,
						clear_hidden_value_on_save: true,
					},
				],
			}),
			schema: {},
		} as Field;

		const mockFields = [mockField] as Field[];

		const sdkSpy = vi.spyOn(sdk, 'request').mockResolvedValue({
			id: 1,
			name: 'Test Item',
		});

		vi.mocked(useCollection).mockReturnValue({
			info: computed(() => mockCollection),
			primaryKeyField: computed(() => mockPrimaryKeyField),
			fields: computed(() => mockFields),
		} as any);

		vi.mocked(usePermissions).mockReturnValue({
			itemPermissions: {
				fields: computed(() => mockFields),
				loading: computed(() => false),
				refresh: vi.fn(),
			},
		} as any);

		vi.mocked(applyConditions).mockReturnValue({
			...mockField,
			meta: {
				...mockField.meta,
				hidden: true,
				clear_hidden_value_on_save: true,
			},
		} as any);

		const { save, edits } = useItem(ref('test'), ref(1));

		edits.value = { status: 'draft' };

		await save();

		expect(sdkSpy.mock.lastCall?.[0]()).toEqual({
			path: '/items/test/1',
			method: 'PATCH',
			body: { status: null },
		});
	});

	test('should clear multiple fields when multiple conditions are triggered', async () => {
		const mockField1 = {
			field: 'status',
			meta: createMockFieldMeta({
				hidden: false,
				conditions: [
					{
						name: 'hidden_when_draft',
						rule: { status: { _eq: 'draft' } },
						hidden: true,
						clear_hidden_value_on_save: true,
					},
				],
			}),
			schema: {
				default_value: 'published',
			},
		} as Field;

		const mockField2 = {
			field: 'description',
			meta: createMockFieldMeta({
				hidden: false,
				conditions: [
					{
						name: 'hidden_when_draft',
						rule: { status: { _eq: 'draft' } },
						hidden: true,
						clear_hidden_value_on_save: true,
					},
				],
			}),
			schema: {
				default_value: 'Default description',
			},
		} as Field;

		const mockFields = [mockField1, mockField2] as Field[];

		const sdkSpy = vi.spyOn(sdk, 'request').mockResolvedValue({
			id: 1,
			name: 'Test Item',
		});

		vi.mocked(useCollection).mockReturnValue({
			info: computed(() => mockCollection),
			primaryKeyField: computed(() => mockPrimaryKeyField),
			fields: computed(() => mockFields),
		} as any);

		vi.mocked(usePermissions).mockReturnValue({
			itemPermissions: {
				fields: computed(() => mockFields),
				loading: computed(() => false),
				refresh: vi.fn(),
			},
		} as any);

		vi.mocked(applyConditions)
			.mockReturnValueOnce({
				...mockField1,
				meta: createMockFieldMeta({
					...mockField1.meta,
					hidden: true,
					clear_hidden_value_on_save: true,
				}),
			})
			.mockReturnValueOnce({
				...mockField2,
				meta: createMockFieldMeta({
					...mockField2.meta,
					hidden: true,
					clear_hidden_value_on_save: true,
				}),
			});

		const { save, edits } = useItem(ref('test'), ref(1));

		edits.value = { status: 'draft', description: 'Custom description' };

		await save();

		expect(sdkSpy.mock.lastCall?.[0]()).toEqual({
			path: '/items/test/1',
			method: 'PATCH',
			body: { status: 'published', description: 'Default description' },
		});
	});

	test('should return original edits when no conditions are triggered', async () => {
		const mockField = {
			field: 'status',
			meta: createMockFieldMeta({
				hidden: false,
				conditions: [
					{
						name: 'hidden_when_published',
						rule: { status: { _eq: 'published' } },
						hidden: true,
						clear_hidden_value_on_save: true,
					},
				],
			}),
			schema: {
				default_value: 'published',
			},
		} as Field;

		const mockFields = [mockField] as Field[];

		const sdkSpy = vi.spyOn(sdk, 'request').mockResolvedValue({
			id: 1,
			name: 'Test Item',
		});

		vi.mocked(useCollection).mockReturnValue({
			info: computed(() => mockCollection),
			primaryKeyField: computed(() => mockPrimaryKeyField),
			fields: computed(() => mockFields),
		} as any);

		vi.mocked(usePermissions).mockReturnValue({
			itemPermissions: {
				fields: computed(() => mockFields),
				loading: computed(() => false),
				refresh: vi.fn(),
			},
		} as any);

		vi.mocked(applyConditions).mockReturnValue({
			...mockField,
			meta: createMockFieldMeta({
				...mockField.meta,
				hidden: false,
				clear_hidden_value_on_save: false,
			}),
		});

		const { save, edits } = useItem(ref('test'), ref(1));

		edits.value = { status: 'draft' };

		await save();

		expect(sdkSpy.mock.lastCall?.[0]()).toEqual({
			path: '/items/test/1',
			method: 'PATCH',
			body: { status: 'draft' },
		});
	});
});
