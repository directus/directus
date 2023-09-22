import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { parsePreset } from './parse-preset';

beforeEach(() => {
	setActivePinia(
		createTestingPinia({
			createSpy: vi.fn,
			initialState: {
				userStore: {
					currentUser: {
						id: '1',
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

describe('parse-preset', () => {
	it('Should return preset with populated variables', () => {
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
