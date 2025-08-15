import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia } from 'pinia';
import { createTestingPinia } from '@pinia/testing';
import { ref, nextTick } from 'vue';

import { useFieldsStore } from '@/stores/fields';
import { useCollectionValidation } from './use-collection-validation';
import type { Field } from '@directus/types';

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

beforeEach(() => {
	setActivePinia(
		createTestingPinia({
			createSpy: vi.fn,
			stubActions: false,
		}),
	);
});

describe('useCollectionValidation', () => {
	it('returns no issues when all required fields exist with correct types', () => {
		const collection = 'ai_prompts';
		const fieldsStore = useFieldsStore();

		fieldsStore.fields = [
			makeField(collection, 'name', 'string'),
			makeField(collection, 'description', 'text'),
			makeField(collection, 'system_prompt', 'text'),
			makeField(collection, 'messages', 'json'),
		];

		const validation = useCollectionValidation(collection);
		expect(validation.value.missingFields).toHaveLength(0);
		expect(validation.value.invalidFields).toHaveLength(0);
	});

	it('detects missing required fields', () => {
		const collection = 'ai_prompts';
		const fieldsStore = useFieldsStore();

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
		const c = ref('coll_a');
		const fieldsStore = useFieldsStore();

		fieldsStore.fields = [
			// coll_a missing most required fields
			makeField('coll_a', 'name', 'string'),
			// coll_b has all required fields
			makeField('coll_b', 'name', 'string'),
			makeField('coll_b', 'description', 'text'),
			makeField('coll_b', 'system_prompt', 'text'),
			makeField('coll_b', 'messages', 'json'),
		];

		const validation = useCollectionValidation(c);
		expect(validation.value.missingFields.length).toBeGreaterThan(0);

		c.value = 'coll_b';
		await nextTick();

		expect(validation.value.missingFields).toHaveLength(0);
		expect(validation.value.invalidFields).toHaveLength(0);
	});
});
