import { useEnv } from '@directus/env';
import sharp, { type FailOnOptions, type Sharp } from 'sharp';

export function getSharpInstance(): Sharp {
	const env = useEnv();

	return sharp({
		limitInputPixels: Math.trunc(Math.pow(env['ASSETS_TRANSFORM_IMAGE_MAX_DIMENSION'] as number, 2)),
		sequentialRead: true,
		failOn: env['ASSETS_INVALID_IMAGE_SENSITIVITY_LEVEL'] as FailOnOptions,
	});
}
