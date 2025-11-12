import { describe, expect, test } from 'vitest';
import { generateCallbackUrl } from './generate-callback-url.js';

describe('generateCallbackUrl', () => {
  test('generates callback URL correctly', () => {
    const result = generateCallbackUrl('github', 'https://directus.app');

    expect(result).toBe('https://directus.app/auth/login/github/callback');
  });
});

