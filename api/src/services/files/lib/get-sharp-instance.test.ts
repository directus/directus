import { getSharpInstance } from './get-sharp-instance.js';
import { useEnv } from '@directus/env';

import { beforeAll, expect, test, vi } from 'vitest';

vi.mock('@directus/env');

vi.mock('sharp', () => {
	const sharp = {
		// using object with default property to mock default import
		default: vi.fn(),
	};

	return sharp;
});

const ASSETS_TRANSFORM_IMAGE_MAX_DIMENSION = 94906265;
const ASSETS_INVALID_IMAGE_SENSITIVITY_LEVEL = 'error';

beforeAll(() => {
	vi.mocked(useEnv).mockReturnValue({
		ASSETS_TRANSFORM_IMAGE_MAX_DIMENSION,
		ASSETS_INVALID_IMAGE_SENSITIVITY_LEVEL,
	});
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
