import { parseFilter } from './parse-filter';
import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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
						roles: [{ id: '1' }, { id: '2' }],
						// Custom nested user field
						org: { name: 'Directus' },
					},
				},
			},
		}),
	);
});

describe('parse-filter', () => {
	it('Should return filter with populated variables', () => {
		const filter = {
			// Static field
			user: { _eq: 'Kay' },
			// Dynamic fields
			role: { _in: ['$CURRENT_ROLE', '2'] },
			roles: { _in: ['$CURRENT_ROLES'] },
			orgName: { _eq: '$CURRENT_USER.org.name' },
		};

		const parsedFilter = parseFilter(filter);

		expect(parsedFilter).toEqual({
			_and: [
				{ user: { _eq: 'Kay' } },
				{ role: { _in: ['1', '2'] } },
				{ roles: { _in: ['1', '2'] } },
				{ orgName: { _eq: 'Directus' } },
			],
		});
	});
});
