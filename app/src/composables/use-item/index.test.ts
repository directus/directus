import api from '@/api';
import { useCollection } from '@directus/composables';
import { AppCollection, Field } from '@directus/types';
import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { computed, ref } from 'vue';

import { useItem } from '.';

vi.mock('@/utils/notify', () => ({
	notify: vi.fn(),
}));

vi.mock('@/utils/apply-conditions', () => ({
	applyConditions: vi.fn(),
}));

vi.mock('@/utils/push-group-options-down', () => ({
	pushGroupOptionsDown: vi.fn((fields) => fields),
}));

vi.mock('@/utils/validate-item', () => ({
	validateItem: vi.fn(() => []),
}));

vi.mock('@/composables/use-nested-validation', () => ({
	useNestedValidation: vi.fn(() => ({
		nestedValidationErrors: ref([]),
	})),
}));

vi.mock('@/composables/use-permissions', () => ({
	usePermissions: vi.fn(() => ({
		itemPermissions: {
			loading: ref(false),
			fields: ref([]),
			refresh: vi.fn(),
		},
	})),
}));

vi.mock('@/api', () => {
	return {
		default: {
			get: vi.fn(),
			post: vi.fn(),
			patch: vi.fn(),
		},
	};
});

vi.mock('@directus/composables');

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
	const apiPostSpy = vi.spyOn(api, 'post');

	const item = { id: 1 };

	const mockRestResponse = {
		data: {
			data: item,
		},
	};

	const mockGraphqlResponse = {
		data: {
			data: { item },
		},
	};

	const mockCollection = {
		collection: 'test',
	} as AppCollection;

	test('should use graphql to fetch existing item', async () => {
		apiPostSpy.mockResolvedValue(mockGraphqlResponse);
		apiPostSpy.mockResolvedValue(mockRestResponse);

		const mockPrimaryKeyFieldName = 'id';

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

		expect(apiPostSpy).toHaveBeenCalledWith('/graphql', { query: 'query { item: test_by_id (id: 1) }' });
	});

	test('should keep manual primary key', async () => {
		apiPostSpy.mockResolvedValueOnce(mockGraphqlResponse);
		apiPostSpy.mockResolvedValueOnce(mockRestResponse);

		const mockPrimaryKeyFieldName = 'id';

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

		expect(apiPostSpy.mock.lastCall![1]).toHaveProperty(mockPrimaryKeyFieldName);
	});

	test('should omit auto incremented primary key', async () => {
		apiPostSpy.mockResolvedValueOnce(mockGraphqlResponse);
		apiPostSpy.mockResolvedValueOnce(mockRestResponse);

		const mockPrimaryKeyFieldName = 'id';

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

		expect(apiPostSpy.mock.lastCall![1]).not.toHaveProperty(mockPrimaryKeyFieldName);
	});

	test('should omit special uuid primary key', async () => {
		apiPostSpy.mockResolvedValueOnce(mockGraphqlResponse);
		apiPostSpy.mockResolvedValueOnce(mockRestResponse);

		const mockPrimaryKeyFieldName = 'id';

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

		expect(apiPostSpy.mock.lastCall![1]).not.toHaveProperty(mockPrimaryKeyFieldName);
	});
});

describe('Clear Hidden Fields', () => {
	const apiPatchSpy = vi.spyOn(api, 'patch');
	const apiGetSpy = vi.spyOn(api, 'get');

	const mockCollection = {
		collection: 'test',
		meta: {},
	} as AppCollection;

	const mockPrimaryKeyField = {
		field: 'id',
	} as Field;

	beforeEach(() => {
		apiGetSpy.mockResolvedValue({
			data: { data: { id: 1, name: 'Test Item', status: 'active' } },
		});

		apiPatchSpy.mockResolvedValue({
			data: { data: { id: 1, name: 'Test Item', status: 'active' } },
		});

		// Reset all mocks before each test
		vi.clearAllMocks();
	});

	test('should clear hidden field with clear_hidden_value_on_save enabled', async () => {
		const mockFields = [
			{
				field: 'name',
				meta: { hidden: true, clear_hidden_value_on_save: true },
				schema: { default_value: 'Default Name' },
			},
			{
				field: 'status',
				meta: { hidden: false },
			},
		] as Field[];

		vi.mocked(useCollection).mockReturnValue({
			info: computed(() => mockCollection),
			primaryKeyField: computed(() => mockPrimaryKeyField),
			fields: computed(() => mockFields),
		} as any);

		// Mock permissions to return the same fields

		const { usePermissions } = await import('@/composables/use-permissions');

		vi.mocked(usePermissions).mockReturnValue({
			itemPermissions: {
				loading: ref(false),
				fields: computed(() => mockFields),
				refresh: vi.fn(),
			},
		} as any);

		const { save, edits } = useItem(ref('test'), ref(1));

		// Set edits with hidden field value

		edits.value = { name: 'Hidden Value', status: 'updated' };

		await save();

		// Should clear hidden field to default value
		expect(apiPatchSpy).toHaveBeenCalledWith('/items/test/1', {
			name: 'Default Name',
			status: 'updated',
		});
	});

	test('should clear hidden field to null when no default value', async () => {
		const mockFields = [
			{
				field: 'description',
				meta: { hidden: true, clear_hidden_value_on_save: true },
				schema: {},
			},
		] as Field[];

		vi.mocked(useCollection).mockReturnValue({
			info: computed(() => mockCollection),
			primaryKeyField: computed(() => mockPrimaryKeyField),
			fields: computed(() => mockFields),
		} as any);

		// Mock permissions to return the same fields

		const { usePermissions } = await import('@/composables/use-permissions');

		vi.mocked(usePermissions).mockReturnValue({
			itemPermissions: {
				loading: ref(false),
				fields: computed(() => mockFields),
				refresh: vi.fn(),
			},
		} as any);

		const { save, edits } = useItem(ref('test'), ref(1));

		edits.value = { description: 'Hidden Description' };

		await save();

		expect(apiPatchSpy).toHaveBeenCalledWith('/items/test/1', {
			description: null,
		});
	});

	test('should not clear hidden field when clear_hidden_value_on_save is disabled', async () => {
		// Reset mocks for this test
		vi.clearAllMocks();

		const mockFields = [
			{
				field: 'name',
				meta: { hidden: true, clear_hidden_value_on_save: false },
				schema: { default_value: 'Default Name' },
			},
		] as Field[];

		vi.mocked(useCollection).mockReturnValue({
			info: computed(() => mockCollection),
			primaryKeyField: computed(() => mockPrimaryKeyField),
			fields: computed(() => mockFields),
		} as any);

		// Mock permissions to return the same fields

		const { usePermissions } = await import('@/composables/use-permissions');

		vi.mocked(usePermissions).mockReturnValue({
			itemPermissions: {
				loading: ref(false),
				fields: computed(() => mockFields),
				refresh: vi.fn(),
			},
		} as any);

		const { save, edits } = useItem(ref('test'), ref(1));

		edits.value = { name: 'Hidden Value' };

		await save();

		// Should keep the hidden field value
		expect(apiPatchSpy).toHaveBeenCalledWith('/items/test/1', {
			name: 'Hidden Value',
		});
	});

	test('should clear field hidden by condition', async () => {
		const { applyConditions } = await import('@/utils/apply-conditions');

		vi.mocked(applyConditions).mockReturnValue({
			field: 'name',
			meta: { hidden: true, clear_hidden_value_on_save: true },
		} as Field);

		const mockFields = [
			{
				field: 'name',
				meta: {
					hidden: false,
					clear_hidden_value_on_save: true,
					conditions: { some: 'condition' },
				},
				schema: { default_value: 'Default Name' },
			},
		] as unknown as Field[];

		vi.mocked(useCollection).mockReturnValue({
			info: computed(() => mockCollection),
			primaryKeyField: computed(() => mockPrimaryKeyField),
			fields: computed(() => mockFields),
		} as any);

		// Mock permissions to return the same fields

		const { usePermissions } = await import('@/composables/use-permissions');

		vi.mocked(usePermissions).mockReturnValue({
			itemPermissions: {
				loading: ref(false),
				fields: computed(() => mockFields),
				refresh: vi.fn(),
			},
		} as any);

		const { save, edits } = useItem(ref('test'), ref(1));

		edits.value = { name: 'Conditionally Hidden Value' };

		await save();

		expect(apiPatchSpy).toHaveBeenCalledWith('/items/test/1', {
			name: 'Default Name',
		});
	});

	test('should not clear primary key field even when hidden', async () => {
		// Reset mocks for this test
		vi.clearAllMocks();

		const mockFields = [
			{
				field: 'id',
				meta: { hidden: true, clear_hidden_value_on_save: true },
				schema: { is_primary_key: true, default_value: 999 },
			},
		] as Field[];

		vi.mocked(useCollection).mockReturnValue({
			info: computed(() => mockCollection),
			primaryKeyField: computed(() => mockPrimaryKeyField),
			fields: computed(() => mockFields),
		} as any);

		// Mock permissions to return the same fields

		const { usePermissions } = await import('@/composables/use-permissions');

		vi.mocked(usePermissions).mockReturnValue({
			itemPermissions: {
				loading: ref(false),
				fields: computed(() => mockFields),
				refresh: vi.fn(),
			},
		} as any);

		const { save, edits } = useItem(ref('test'), ref(1));

		edits.value = { id: 999 };

		await save();

		// Should keep the primary key value
		expect(apiPatchSpy).toHaveBeenCalledWith('/items/test/1', {
			id: 999,
		});
	});

	test('should not clear generated field even when hidden', async () => {
		// Reset mocks for this test
		vi.clearAllMocks();

		const mockFields = [
			{
				field: 'created_at',
				meta: { hidden: true, clear_hidden_value_on_save: true },
				schema: { is_generated: true },
			},
		] as Field[];

		vi.mocked(useCollection).mockReturnValue({
			info: computed(() => mockCollection),
			primaryKeyField: computed(() => mockPrimaryKeyField),
			fields: computed(() => mockFields),
		} as any);

		// Mock permissions to return the same fields

		const { usePermissions } = await import('@/composables/use-permissions');

		vi.mocked(usePermissions).mockReturnValue({
			itemPermissions: {
				loading: ref(false),
				fields: computed(() => mockFields),
				refresh: vi.fn(),
			},
		} as any);

		const { save, edits } = useItem(ref('test'), ref(1));

		edits.value = { created_at: '2023-01-01T00:00:00Z' };

		await save();

		expect(apiPatchSpy).toHaveBeenCalledWith('/items/test/1', {
			created_at: '2023-01-01T00:00:00Z',
		});
	});

	test('should not clear system field even when hidden', async () => {
		// Reset mocks for this test
		vi.clearAllMocks();

		const mockFields = [
			{
				field: 'system_field',
				meta: { hidden: true, clear_hidden_value_on_save: true, system: true },
				schema: { default_value: 'default' },
			},
		] as Field[];

		vi.mocked(useCollection).mockReturnValue({
			info: computed(() => mockCollection),
			primaryKeyField: computed(() => mockPrimaryKeyField),
			fields: computed(() => mockFields),
		} as any);

		// Mock permissions to return the same fields

		const { usePermissions } = await import('@/composables/use-permissions');

		vi.mocked(usePermissions).mockReturnValue({
			itemPermissions: {
				loading: ref(false),
				fields: computed(() => mockFields),
				refresh: vi.fn(),
			},
		} as any);

		const { save, edits } = useItem(ref('test'), ref(1));

		edits.value = { system_field: 'system value' };

		await save();

		expect(apiPatchSpy).toHaveBeenCalledWith('/items/test/1', {
			system_field: 'system value',
		});
	});

	test('should clear multiple hidden fields', async () => {
		const mockFields = [
			{
				field: 'name',
				meta: { hidden: true, clear_hidden_value_on_save: true },
				schema: { default_value: 'Default Name' },
			},
			{
				field: 'description',
				meta: { hidden: true, clear_hidden_value_on_save: true },
				schema: {},
			},
			{
				field: 'status',
				meta: { hidden: false },
			},
		] as Field[];

		vi.mocked(useCollection).mockReturnValue({
			info: computed(() => mockCollection),
			primaryKeyField: computed(() => mockPrimaryKeyField),
			fields: computed(() => mockFields),
		} as any);

		// Mock permissions to return the same fields

		const { usePermissions } = await import('@/composables/use-permissions');

		vi.mocked(usePermissions).mockReturnValue({
			itemPermissions: {
				loading: ref(false),
				fields: computed(() => mockFields),
				refresh: vi.fn(),
			},
		} as any);

		const { save, edits } = useItem(ref('test'), ref(1));

		edits.value = {
			name: 'Hidden Name',
			description: 'Hidden Description',
			status: 'active',
		};

		await save();

		expect(apiPatchSpy).toHaveBeenCalledWith('/items/test/1', {
			name: 'Default Name',
			description: null,
			status: 'active',
		});
	});

	test('should return original edits when no fields need clearing', async () => {
		// Reset mocks for this test
		vi.clearAllMocks();

		const mockFields = [
			{
				field: 'name',
				meta: { hidden: false },
			},
			{
				field: 'status',
				meta: { hidden: false },
			},
		] as Field[];

		vi.mocked(useCollection).mockReturnValue({
			info: computed(() => mockCollection),
			primaryKeyField: computed(() => mockPrimaryKeyField),
			fields: computed(() => mockFields),
		} as any);

		// Mock permissions to return the same fields

		const { usePermissions } = await import('@/composables/use-permissions');

		vi.mocked(usePermissions).mockReturnValue({
			itemPermissions: {
				loading: ref(false),
				fields: computed(() => mockFields),
				refresh: vi.fn(),
			},
		} as any);

		const { save, edits } = useItem(ref('test'), ref(1));

		edits.value = { name: 'Test Name', status: 'active' };

		await save();

		expect(apiPatchSpy).toHaveBeenCalledWith('/items/test/1', {
			name: 'Test Name',
			status: 'active',
		});
	});

	test('should clear field when hidden by condition with clear_hidden_value_on_save set in condition', async () => {
		// Reset mocks for this test
		vi.clearAllMocks();

		// Mock applyConditions to return a field with clear_hidden_value_on_save from condition
		const { applyConditions } = await import('@/utils/apply-conditions');

		vi.mocked(applyConditions).mockImplementation((item, field) => {
			// Simulate a condition that hides the field and sets clear_hidden_value_on_save
			if (field.field === 'conditional_field' && item.status === 'draft') {
				return {
					...field,
					meta: {
						...field.meta,
						hidden: true,
						clear_hidden_value_on_save: true,
					},
				};
			}

			return field;
		});

		const mockFields = [
			{
				field: 'conditional_field',
				meta: {
					hidden: false, // Not statically hidden
					clear_hidden_value_on_save: false, // Not set at field level
					conditions: [
						{
							name: 'Hide when status is draft',
							rule: { status: { _eq: 'draft' } },
							hidden: true,
							clear_hidden_value_on_save: true, // Set in condition
						},
					],
				},
				schema: { default_value: 'Default Value' },
			},
			{
				field: 'status',
				meta: { hidden: false },
			},
		] as Field[];

		vi.mocked(useCollection).mockReturnValue({
			info: computed(() => mockCollection),
			primaryKeyField: computed(() => mockPrimaryKeyField),
			fields: computed(() => mockFields),
		} as any);

		// Mock permissions to return the same fields
		const { usePermissions } = await import('@/composables/use-permissions');

		vi.mocked(usePermissions).mockReturnValue({
			itemPermissions: {
				loading: ref(false),
				fields: computed(() => mockFields),
				refresh: vi.fn(),
			},
		} as any);

		const { save, edits } = useItem(ref('test'), ref(1));

		// Set up item with status that triggers the condition
		edits.value = {
			conditional_field: 'Some Value',
			status: 'draft', // This should trigger the condition
		};

		await save();

		// Should clear the field because it's hidden by condition with clear_hidden_value_on_save set
		expect(apiPatchSpy).toHaveBeenCalledWith('/items/test/1', {
			conditional_field: 'Default Value',
			status: 'draft',
		});
	});

	test('should not clear field when hidden by condition but clear_hidden_value_on_save not set in condition', async () => {
		// Reset mocks for this test
		vi.clearAllMocks();

		// Mock applyConditions to return a field hidden by condition but without clear_hidden_value_on_save
		const { applyConditions } = await import('@/utils/apply-conditions');

		vi.mocked(applyConditions).mockImplementation((item, field) => {
			// Simulate a condition that hides the field but doesn't set clear_hidden_value_on_save
			if (field.field === 'conditional_field' && item.status === 'draft') {
				return {
					...field,
					meta: {
						...field.meta,
						hidden: true,
						clear_hidden_value_on_save: false, // Not set in condition
					},
				};
			}

			return field;
		});

		const mockFields = [
			{
				field: 'conditional_field',
				meta: {
					hidden: false, // Not statically hidden
					clear_hidden_value_on_save: false, // Not set at field level
					conditions: [
						{
							name: 'Hide when status is draft',
							rule: { status: { _eq: 'draft' } },
							hidden: true,
							clear_hidden_value_on_save: false, // Not set in condition
						},
					],
				},
				schema: { default_value: 'Default Value' },
			},
			{
				field: 'status',
				meta: { hidden: false },
			},
		] as Field[];

		vi.mocked(useCollection).mockReturnValue({
			info: computed(() => mockCollection),
			primaryKeyField: computed(() => mockPrimaryKeyField),
			fields: computed(() => mockFields),
		} as any);

		// Mock permissions to return the same fields
		const { usePermissions } = await import('@/composables/use-permissions');

		vi.mocked(usePermissions).mockReturnValue({
			itemPermissions: {
				loading: ref(false),
				fields: computed(() => mockFields),
				refresh: vi.fn(),
			},
		} as any);

		const { save, edits } = useItem(ref('test'), ref(1));

		// Set up item with status that triggers the condition
		edits.value = {
			conditional_field: 'Some Value',
			status: 'draft', // This should trigger the condition
		};

		await save();

		// Should NOT clear the field because clear_hidden_value_on_save is not set in the condition
		expect(apiPatchSpy).toHaveBeenCalledWith('/items/test/1', {
			conditional_field: 'Some Value', // Should keep original value
			status: 'draft',
		});
	});
});
