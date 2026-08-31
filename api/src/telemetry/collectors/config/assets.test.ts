import { describe, expect, test } from 'vitest';
import { collectAssets } from './assets.js';

describe('collectAssets', () => {
	test('returns null for unset limits', () => {
		expect(collectAssets({})).toStrictEqual({
			transform_max_concurrent: null,
			image_max_dimension: null,
			image_max_output_dimension: null,
		});
	});

	test('coerces configured limits to numbers', () => {
		expect(
			collectAssets({
				ASSETS_TRANSFORM_MAX_CONCURRENT: '25',
				ASSETS_TRANSFORM_IMAGE_MAX_DIMENSION: 6000,
				ASSETS_TRANSFORM_IMAGE_MAX_OUTPUT_DIMENSION: 3000,
			}),
		).toStrictEqual({ transform_max_concurrent: 25, image_max_dimension: 6000, image_max_output_dimension: 3000 });
	});
});
