import type { CollectionsOverview, SchemaOverview } from '@directus/types';
import { describe, expect, test } from 'vitest';

describe('Remove invalid graphql names', () => {
	const testSchema: SchemaOverview = {
		collections: {
			normal_collection: {} as CollectionsOverview,

		},
		relations: [],
	}

	test('Filters out invalid names', () => {

	});
})
