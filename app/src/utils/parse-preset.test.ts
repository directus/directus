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
import { parsePreset } from './parse-preset';

describe('parse-preset', () => {

	it('Should return preset with populated variables', () => {
		const userStore = useUserStore();
		expect(userStore.currentUser).toHaveProperty('first_name', 'john');

		userStore.currentUser = Object.assign({}, userStore.currentUser, {
			org: {
				name: 'Directus',
			}
		});

		const preset = {
			role: '$CURRENT_ROLE',
			orgName: '$CURRENT_USER.org.name',
		};

		const parsedPreset = parsePreset(preset);

		expect(parsedPreset).toEqual({
			role: '1',
			orgName: 'Directus',
		});
	});
});
