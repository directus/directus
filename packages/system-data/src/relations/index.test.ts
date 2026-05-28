import { describe, expect, test } from 'vitest';
import { systemRelationRows } from './index.js';

describe('systemRelationRows', () => {
	test('includes the OAuth client assertion replay marker relation', () => {
		expect(systemRelationRows).toContainEqual(
			expect.objectContaining({
				many_collection: 'directus_oauth_client_assertions',
				many_field: 'client',
				one_collection: 'directus_oauth_clients',
				system: true,
			}),
		);
	});
});
