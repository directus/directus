import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick, ref } from 'vue';

import { useCollectionsStore } from '@/stores/collections';
import { useFieldsStore } from '@/stores/fields';
import { Collection } from '@/types/collections';
import type { Field } from '@directus/types';
import { useCollectionValidation } from './use-collection-validation';

function makeField(collection: string, field: string, type: Field['type']): Field {
	// Create a minimal Field object sufficient for the store utilities used in tests
	return {
		collection,
		field,
		type,
		name: field,
		schema: null,
		meta: {
			// Only properties referenced in getFieldsForCollection sorting are relevant
			sort: undefined,
			system: undefined,
		} as any,
	} as unknown as Field;
}

function makeCollection(collection: string): Collection {
	// Create a minimal Collection object sufficient for the store utilities used in tests
	return {
		collection,
		name: collection,
		meta: {},
		schema: {},
	} as unknown as Collection;
}

beforeEach(() => {
	setActivePinia(
		createTestingPinia({
			createSpy: vi.fn,
			stubActions: false,
		}),
	);
});

describe('useCollectionValidation', () => {
	it('detects non-existent collection', () => {
		const collection = 'ai_prompts';

		const validation = useCollectionValidation(collection);
		expect(validation.value.collectionNotFound).toBe(true);
		expect(validation.value.missingFields).toHaveLength(0);
		expect(validation.value.invalidFields).toHaveLength(0);
	});

	it('returns no issues when all required fields exist with correct types', () => {
		const collection = 'ai_prompts';
		const fieldsStore = useFieldsStore();
		const collectionStore = useCollectionsStore();

		collectionStore.collections = [makeCollection(collection)];

		fieldsStore.fields = [
			makeField(collection, 'name', 'string'),
			makeField(collection, 'description', 'text'),
			makeField(collection, 'system_prompt', 'text'),
			makeField(collection, 'messages', 'json'),
		];

		const validation = useCollectionValidation(collection);
		expect(validation.value.collectionNotFound).toBe(false);
		expect(validation.value.missingFields).toHaveLength(0);
		expect(validation.value.invalidFields).toHaveLength(0);
	});

	it('detects missing required fields', () => {
		const collection = 'ai_prompts';
		const fieldsStore = useFieldsStore();
		const collectionStore = useCollectionsStore();

		collectionStore.collections = [makeCollection(collection)];

		// Only provide a subset
		fieldsStore.fields = [makeField(collection, 'name', 'string')];

		const validation = useCollectionValidation(collection);
		const missing = validation.value.missingFields.map((f) => f.field).sort();

		expect(missing).toEqual(['description', 'messages', 'system_prompt'].sort());
		expect(validation.value.invalidFields).toHaveLength(0);
	});

	it('detects invalid field types for existing fields', () => {
		const collection = 'ai_prompts';
		const fieldsStore = useFieldsStore();
		const collectionStore = useCollectionsStore();

		collectionStore.collections = [makeCollection(collection)];

		fieldsStore.fields = [
			makeField(collection, 'name', 'integer'), // should be string
			makeField(collection, 'description', 'text'),
			makeField(collection, 'system_prompt', 'text'),
			makeField(collection, 'messages', 'json'),
		];

		const validation = useCollectionValidation(collection);
		const invalid = validation.value.invalidFields.map((f) => f.field);

		expect(invalid).toContain('name');
		expect(validation.value.missingFields).toHaveLength(0);
	});

	it('reacts to collection ref changes', async () => {
		const collection = ref('coll_a');
		const fieldsStore = useFieldsStore();
		const collectionStore = useCollectionsStore();

		collectionStore.collections = [makeCollection('coll_a'), makeCollection('coll_b')];

		fieldsStore.fields = [
			// coll_a missing most required fields
			makeField('coll_a', 'name', 'string'),
			// coll_b has all required fields
			makeField('coll_b', 'name', 'string'),
			makeField('coll_b', 'description', 'text'),
			makeField('coll_b', 'system_prompt', 'text'),
			makeField('coll_b', 'messages', 'json'),
		];

		const validation = useCollectionValidation(collection);
		expect(validation.value.missingFields.length).toBeGreaterThan(0);

		collection.value = 'coll_b';
		await nextTick();

		expect(validation.value.collectionNotFound).toBe(false);
		expect(validation.value.missingFields).toHaveLength(0);
		expect(validation.value.invalidFields).toHaveLength(0);
	});
});
