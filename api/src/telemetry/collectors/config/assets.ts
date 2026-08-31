import type { TelemetryConfig } from '../../types/report.js';
import { numberOrNull } from '../../utils/env-value.js';

export function collectAssets(env: Record<string, unknown>): TelemetryConfig['assets'] {
	return {
		transform_max_concurrent: numberOrNull(env['ASSETS_TRANSFORM_MAX_CONCURRENT']),
		image_max_dimension: numberOrNull(env['ASSETS_TRANSFORM_IMAGE_MAX_DIMENSION']),
		image_max_output_dimension: numberOrNull(env['ASSETS_TRANSFORM_IMAGE_MAX_OUTPUT_DIMENSION']),
	};
}
