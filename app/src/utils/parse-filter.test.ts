import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

beforeEach(() => {
	setActivePinia(
		createTestingPinia({
			createSpy: vi.fn,
			initialState: {
				currentUser: {
					first_name: 'john',
					role: {
						id: '1',
						name: 'admin',
					},
				},
			},
		})
	);
});

import { useUserStore } from '@/stores/user';
import { parseFilter } from './parse-filter';

describe('parse-filter', () => {
	it('Should return filter with populated variables', () => {
		const userStore = useUserStore();
		expect(userStore.currentUser).toHaveProperty('first_name', 'john');

		userStore.currentUser = Object.assign({}, userStore.currentUser, {
			org: {
				name: 'Directus',
			}
		});

		const filter = {
			role: { _in: ["$CURRENT_ROLE", '2'] },
			orgName: { _eq: '$CURRENT_USER.org.name' },
		};

		const parsedFilter = parseFilter(filter);

		expect(parsedFilter).toEqual({
			role: { _in: ['1', '2'] },
			orgName: { _eq: 'john' },
		});
	});
});
