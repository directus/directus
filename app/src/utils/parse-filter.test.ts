import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { parseFilter } from './parse-filter';

beforeEach(() => {
	setActivePinia(
		createTestingPinia({
			createSpy: vi.fn,
			initialState: {
				userStore: {
					currentUser: {
						id: '1',
						first_name: 'Kay',
						role: {
							id: '1',
							name: 'admin',
						},
						// Custom nested user field
						org: { name: 'Directus' },
					},
				},
			},
		})
	);
});

describe('parse-filter', () => {
	it('Should return filter with populated variables', () => {
		const filter = {
			// Static field
			user: { _eq: 'Kay' },
			// Dynamic fields
			role: { _in: ['$CURRENT_ROLE', '2'] },
			orgName: { _eq: '$CURRENT_USER.org.name' },
		};

		const parsedFilter = parseFilter(filter);

		expect(parsedFilter).toEqual({
			_and: [{ user: { _eq: 'Kay' } }, { role: { _in: ['1', '2'] } }, { orgName: { _eq: 'Directus' } }],
		});
	});
});
