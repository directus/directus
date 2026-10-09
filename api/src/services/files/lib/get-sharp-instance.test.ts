import { useEnv } from '@directus/env';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { getSharpInstance } from './get-sharp-instance.js';

vi.mock('@directus/env', async () => {
	const { mockEnv } = await import('../../../test-utils/env.js');
	return mockEnv();
});

vi.mock('sharp', () => {
	const sharp = {
		// using object with default property to mock default import
		default: vi.fn(),
	};

	return sharp;
});

const ASSETS_TRANSFORM_IMAGE_MAX_DIMENSION = 94906265;
const ASSETS_INVALID_IMAGE_SENSITIVITY_LEVEL = 'error';

beforeEach(() => {
	const env = vi.mocked(useEnv)() as Record<string, unknown>;
	env['ASSETS_TRANSFORM_IMAGE_MAX_DIMENSION'] = ASSETS_TRANSFORM_IMAGE_MAX_DIMENSION;
	env['ASSETS_INVALID_IMAGE_SENSITIVITY_LEVEL'] = ASSETS_INVALID_IMAGE_SENSITIVITY_LEVEL;
});

afterEach(() => {
	const env = vi.mocked(useEnv)() as Record<string, unknown>;
	delete env['ASSETS_TRANSFORM_IMAGE_MAX_DIMENSION'];
	delete env['ASSETS_INVALID_IMAGE_SENSITIVITY_LEVEL'];
	vi.clearAllMocks();
});

test('getSharpInstance should apply the correct options', async () => {
	const sharp = await import('sharp');

	getSharpInstance();

	expect(sharp.default).toHaveBeenCalledWith({
		limitInputPixels: Math.pow(ASSETS_TRANSFORM_IMAGE_MAX_DIMENSION, 2),
		sequentialRead: true,
		failOn: ASSETS_INVALID_IMAGE_SENSITIVITY_LEVEL,
	});
});

test.each([
	['undefined', undefined],
	['a non-numeric string', 'not-a-number'],
	['zero', 0],
	['a negative number', -100],
])('getSharpInstance should fall back to the default max dimension when the env var is %s', async (_label, value) => {
	const sharp = await import('sharp');

	const env = vi.mocked(useEnv)() as Record<string, unknown>;
	env['ASSETS_TRANSFORM_IMAGE_MAX_DIMENSION'] = value;

	getSharpInstance();

	expect(sharp.default).toHaveBeenCalledWith({
		limitInputPixels: Math.pow(6000, 2),
		sequentialRead: true,
		failOn: ASSETS_INVALID_IMAGE_SENSITIVITY_LEVEL,
	});
});
