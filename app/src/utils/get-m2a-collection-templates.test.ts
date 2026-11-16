import { expect, test } from 'vitest';
import { getM2ACollectionTemplates } from './get-m2a-collection-templates';
import type { RelationM2A } from '@/composables/use-relation-m2a';

function relation(
	collections: { collection: string; display_template?: string | null; singleton?: boolean; pk?: string }[],
) {
	return {
		allowedCollections: collections.map(({ collection, display_template = null, singleton = false }) => ({
			collection,
			meta: { display_template, singleton },
		})),
		relationPrimaryKeyFields: Object.fromEntries(
			collections.filter(({ pk }) => pk).map(({ collection, pk }) => [collection, { field: pk }]),
		),
	} as unknown as RelationM2A;
}

test('uses the collection display template', () => {
	expect(
		getM2ACollectionTemplates(relation([{ collection: 'headings', display_template: '{{text}}', pk: 'id' }])),
	).toEqual({ headings: '{{text}}' });
});

test('falls back to the primary key', () => {
	expect(getM2ACollectionTemplates(relation([{ collection: 'texts', pk: 'uid' }]))).toEqual({ texts: '{{uid}}' });
});

test('skips collections without a template or primary key', () => {
	expect(getM2ACollectionTemplates(relation([{ collection: 'texts' }]))).toEqual({});
});

test('skips singleton collections', () => {
	expect(
		getM2ACollectionTemplates(
			relation([
				{ collection: 'settings', display_template: '{{title}}', singleton: true, pk: 'id' },
				{ collection: 'texts', pk: 'uid' },
			]),
		),
	).toEqual({ texts: '{{uid}}' });
});
