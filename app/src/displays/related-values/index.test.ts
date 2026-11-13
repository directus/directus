import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { seedM2A } from './test-fixtures';
import display from './index';
import { useCollectionsStore } from '@/stores/collections';
import { useFieldsStore } from '@/stores/fields';

vi.mock('@/composables/use-extension', () => ({
	useExtension: () => ({ value: null }),
}));

beforeEach(() => {
	setActivePinia(createTestingPinia({ createSpy: vi.fn, stubActions: false }));
});

function getFields(template: string | null) {
	const fields = display.fields as (options: { template: string } | null, context: any) => string[];
	return fields(template ? { template } : null, { collection: 'pages', field: 'blocks', type: 'alias' }).sort();
}

describe('fields for an M2A field', () => {
	test('requests each allowed collection template and primary key when no template is set', () => {
		seedM2A();

		expect(getFields(null)).toEqual(['id', 'kind', 'target:headings.id', 'target:headings.text', 'target:texts.uid']);
	});

	test('skips inactive allowed collections when no template is set', () => {
		seedM2A();
		useCollectionsStore().getCollection('texts')!.meta!.status = 'inactive';

		expect(getFields(null)).toEqual(['id', 'kind', 'target:headings.id', 'target:headings.text']);
	});

	test('skips allowed collections that have no primary key', () => {
		seedM2A();
		useFieldsStore().fields = useFieldsStore().fields.filter((field) => field.field !== 'uid');

		expect(getFields(null)).toEqual(['id', 'kind', 'target:headings.id', 'target:headings.text']);
	});

	test('requests the display option template fields on the junction', () => {
		seedM2A();

		expect(getFields('{{target:headings.text}}')).toEqual([
			'id',
			'kind',
			'target:headings.id',
			'target:headings.text',
			'target:texts.uid',
		]);
	});

	test('requests the junction display template fields when no display option template is set', () => {
		seedM2A({ junctionTemplate: '{{target:texts.body}}' });

		expect(getFields(null)).toEqual(['id', 'kind', 'target:headings.id', 'target:texts.body', 'target:texts.uid']);
	});
});
