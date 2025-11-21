import { describe, expect, test, vi } from 'vitest';
import { generateCallbackUrl } from './generate-callback-url.js';

vi.mock('@directus/env');
vi.mock('../../logger/index.js');

import { useEnv } from '@directus/env';

describe('generateCallbackUrl', () => {
	test('generates callback URL correctly', () => {
		const PUBLIC_URL = 'https://directus.app/api';

		vi.mocked(useEnv).mockReturnValue({
			PUBLIC_URL,
		});

		const result = generateCallbackUrl('github');

		expect(result).toBe(`${PUBLIC_URL}/auth/login/github/callback`);
	});
});
