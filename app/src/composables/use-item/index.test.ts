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
