import api from '@/api';
import { useCollection } from '@directus/composables';
import { AppCollection, Field } from '@directus/types';
import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { computed, ref } from 'vue';

import { useItem } from './use-item';

vi.mock('@/utils/notify', () => ({
	notify: vi.fn(),
}));

vi.mock('@/api', () => {
	return {
		default: {
			get: vi.fn(),
			post: vi.fn(),
		},
	};
});

vi.mock('@directus/composables');

beforeEach(() => {
	setActivePinia(
		createTestingPinia({
			createSpy: vi.fn,
			stubActions: false,
		})
	);
});

afterEach(() => {
	vi.clearAllMocks();
});

describe('Save As Copy', () => {
	const apiGetSpy = vi.spyOn(api, 'get');
	const apiPostSpy = vi.spyOn(api, 'post');

	const mockResponse = {
		data: {
			data: { id: 1 },
		},
	};

	const mockCollection = {
		collection: 'test',
		name: 'test',
		meta: {
			archive_field: null,
			singleton: false,
		},
		schema: {},
	} as AppCollection;

	test('should keep manual primary key', async () => {
		apiGetSpy.mockResolvedValue(mockResponse);
		apiPostSpy.mockResolvedValue(mockResponse);

		const mockPrimaryKeyFieldName = 'id';

		const mockPrimaryKeyField = {
			collection: 'test',
			field: mockPrimaryKeyFieldName,
			type: 'string',
			schema: {
				is_primary_key: true,
				is_generated: false,
			},
			meta: {
				collection: 'test',
				field: mockPrimaryKeyFieldName,
				special: null,
				options: null,
				display_options: null,
				note: null,
				validation_message: null,
			},
		} as Field;

		const mockFields = [
			mockPrimaryKeyField,
			{
				collection: 'test',
				field: 'name',
				type: 'string',
				schema: {},
				meta: {
					collection: 'test',
					field: 'name',
					options: null,
					display_options: null,
					note: null,
					validation_message: null,
				},
			},
		] as Field[];

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
		apiGetSpy.mockResolvedValue(mockResponse);
		apiPostSpy.mockResolvedValue(mockResponse);

		const mockPrimaryKeyFieldName = 'id';

		const mockPrimaryKeyField = {
			collection: 'test',
			field: mockPrimaryKeyFieldName,
			type: 'integer',
			schema: {
				has_auto_increment: true,
				is_primary_key: true,
				is_generated: false,
			},
			meta: {
				collection: 'test',
				field: mockPrimaryKeyFieldName,
				options: null,
				display_options: null,
				note: null,
				validation_message: null,
			},
		} as Field;

		const mockFields = [
			mockPrimaryKeyField,
			{
				collection: 'test',
				field: 'name',
				type: 'string',
				schema: {},
				meta: {
					collection: 'test',
					field: 'name',
					options: null,
					display_options: null,
					note: null,
					validation_message: null,
				},
			},
		] as Field[];

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
		apiGetSpy.mockResolvedValue(mockResponse);
		apiPostSpy.mockResolvedValue(mockResponse);

		const mockPrimaryKeyFieldName = 'id';

		const mockPrimaryKeyField = {
			collection: 'test',
			field: mockPrimaryKeyFieldName,
			type: 'uuid',
			schema: {
				is_primary_key: true,
				has_auto_increment: false,
				is_generated: false,
			},
			meta: {
				collection: 'test',
				field: mockPrimaryKeyFieldName,
				options: null,
				display_options: null,
				note: null,
				special: ['uuid'],
				validation_message: null,
			},
		} as Field;

		const mockFields = [
			mockPrimaryKeyField,
			{
				collection: 'test',
				field: 'name',
				type: 'string',
				schema: {},
				meta: {
					collection: 'test',
					field: 'name',
					options: null,
					display_options: null,
					note: null,
					validation_message: null,
				},
			},
		] as Field[];

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
