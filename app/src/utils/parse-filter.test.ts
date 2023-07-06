import { useUserStore } from '@/stores/user';
import { describe, expect, it } from 'vitest';
import { parseFilter } from './parse-filter';

describe('parse-filter', () => {
	it('Should return filter with populated variables', () => {
		const userStore = useUserStore();

		userStore.currentUser = {
			name: 'john',
			role: {
				id: 1,
				name: 'admin',
			},
		} as any;

		const filter = {
			role: { _eq: '$CURRENT_ROLE.id' },
			user: { _eq: '$CURRENT_USER.name' },
		};

		const parsedFilter = parseFilter(filter);

		expect(parsedFilter).toEqual({
			role: { _eq: 1 },
			user: { _eq: 'john' },
		});
	});
});
