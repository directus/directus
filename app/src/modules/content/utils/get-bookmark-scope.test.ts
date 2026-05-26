import { describe, expect, it } from 'vitest';
import { getBookmarkScope } from './get-bookmark-scope';

describe('getBookmarkScope', () => {
	it('returns "personal" when only user is set', () => {
		expect(getBookmarkScope({ user: 'user-1', role: null })).toBe('personal');
	});

	it('returns "role" when only role is set', () => {
		expect(getBookmarkScope({ user: null, role: 'role-1' })).toBe('role');
	});

	it('returns "global" when neither user nor role is set', () => {
		expect(getBookmarkScope({ user: null, role: null })).toBe('global');
	});

	it('returns "global" when both user and role are set', () => {
		expect(getBookmarkScope({ user: 'user-1', role: 'role-1' })).toBe('global');
	});

	it('treats missing user/role fields as unset', () => {
		expect(getBookmarkScope({})).toBe('global');
	});
});
