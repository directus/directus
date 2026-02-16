import { describe, expect, it, vi } from 'vitest';
import {  formatUserAvatar, getFocusId } from './utils';
import type { CollabUser } from '@/composables/use-collab';

vi.mock('@/utils/get-asset-url', () => ({
	getAssetUrl: (id: string, opts: Record<string, unknown>) => `http://assets/${id}?key=${opts.imageKey}`,
}));

describe('formatUserAvatar', () => {
	const baseUser: CollabUser = {
		id: 'user-1',
		connection: 'conn-1' as CollabUser['connection'],
		color: 'red',
	};

	it('should format full name from first and last', () => {
		const result = formatUserAvatar({ ...baseUser, first_name: 'John', last_name: 'Doe' });

		expect(result.name).toBe('John Doe');
		expect(result.id).toBe('user-1');
		expect(result.connection).toBe('conn-1');
		expect(result.color).toBe('red');
	});

	it('should handle first name only', () => {
		const result = formatUserAvatar({ ...baseUser, first_name: 'John' });
		expect(result.name).toBe('John');
	});

	it('should handle last name only', () => {
		const result = formatUserAvatar({ ...baseUser, last_name: 'Doe' });
		expect(result.name).toBe('Doe');
	});

	it('should return undefined name when no names provided', () => {
		const result = formatUserAvatar(baseUser);
		expect(result.name).toBeUndefined();
	});

	it('should return avatar_url when avatar exists', () => {
		const user: CollabUser = {
			...baseUser,
			avatar: { id: 'avatar-123', modified_on: new Date('2025-01-01') },
		};

		const result = formatUserAvatar(user);
		expect(result.avatar_url).toBe('http://assets/avatar-123?key=system-medium-cover');
	});

	it('should return undefined avatar_url when no avatar', () => {
		const result = formatUserAvatar(baseUser);
		expect(result.avatar_url).toBeUndefined();
	});
});

describe('getFocusId', () => {
	it('should return the correct id', () => {
		expect(getFocusId('conn-1')).toBe('collab-focus-conn-1');
	});
});
