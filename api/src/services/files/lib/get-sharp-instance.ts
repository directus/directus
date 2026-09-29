import { useEnv } from '@directus/env';
import sharp, { type FailOnOptions, type Sharp } from 'sharp';
import { toDimension } from '../../assets/assert-transforms-allowed.js';

export function getSharpInstance(): Sharp {
	const env = useEnv();

	const maxInputDimension = toDimension(env['ASSETS_TRANSFORM_IMAGE_MAX_DIMENSION']) ?? 6000;

	return sharp({
		limitInputPixels: Math.trunc(Math.pow(maxInputDimension, 2)),
		sequentialRead: true,
		failOn: env['ASSETS_INVALID_IMAGE_SENSITIVITY_LEVEL'] as FailOnOptions,
	});
}
