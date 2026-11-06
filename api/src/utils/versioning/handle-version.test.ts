import type { Relation } from '@directus/types';
import { describe, expect, test } from 'vitest';
import { isM2AJunctionCollection } from './handle-version.js';

describe('isM2AJunctionCollection', () => {
	const m2aRelation: Relation = {
		collection: 'pages_blocks',
		field: 'item',
		related_collection: null,
		schema: null,
		meta: {
			id: 1,
			many_collection: 'pages_blocks',
			many_field: 'item',
			one_collection: null,
			one_field: null,
			one_collection_field: 'collection',
			one_allowed_collections: ['faq_blocks'],
			one_deselect_action: 'delete',
			junction_field: 'pages_id',
			sort_field: null,
		},
	};

	test('identifies an M2A junction collection', () => {
		expect(isM2AJunctionCollection([m2aRelation], 'pages_blocks')).toBe(true);
	});

	test('does not identify a regular relation junction collection', () => {
		expect(
			isM2AJunctionCollection(
				[
					{
						...m2aRelation,
						meta: {
							...m2aRelation.meta!,
							one_collection_field: null,
							one_allowed_collections: null,
						},
					},
				],
				'pages_blocks',
			),
		).toBe(false);
	});

	test('does not identify an unrelated collection', () => {
		expect(isM2AJunctionCollection([m2aRelation], 'pages')).toBe(false);
	});
});
