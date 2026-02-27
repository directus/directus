import { describe, expect, test, vi } from 'vitest';
import { collectEmail } from './email.js';

// Mock environment variables
vi.mock('@directus/env', () => ({
	useEnv: vi.fn().mockReturnValue({}),
}));

describe('collectEmail', () => {
	test('returns null transport by default', () => {
		expect(collectEmail({})).toEqual({ transport: null });
	});

	test('returns configured transport', () => {
		expect(collectEmail({ EMAIL_TRANSPORT: 'smtp' })).toEqual({ transport: 'smtp' });
	});
});
