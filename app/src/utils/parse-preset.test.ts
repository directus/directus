import { useUserStore } from '@/stores/user';
import { describe, expect, it } from 'vitest';
import { parsePreset } from './parse-preset';

describe('parse-preset', () => {
	it('Should return preset with populated variables', () => {
		const userStore = useUserStore();

		userStore.currentUser = {
			name: 'john',
			role: {
				id: 1,
				name: 'admin',
			}
		} as any;

		const preset = {
			role: '$CURRENT_ROLE.id',
			user: '$CURRENT_USER.name',
		}

		const parsedPreset = parsePreset(preset);

		expect(parsedPreset).toEqual({
			role: 1,
			user: 'john',
		});
	});
});
