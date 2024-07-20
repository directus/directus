import sharp, { type Sharp, type FailOnOptions } from 'sharp';
import { useEnv } from '@directus/env';

function getSharpInstance(): Sharp {
	const env = useEnv();

	return sharp({
		limitInputPixels: Math.trunc(Math.pow(env['ASSETS_TRANSFORM_IMAGE_MAX_DIMENSION'] as number, 2)),
		sequentialRead: true,
		failOn: env['ASSETS_INVALID_IMAGE_SENSITIVITY_LEVEL'] as FailOnOptions,
	});
}

export { getSharpInstance };
