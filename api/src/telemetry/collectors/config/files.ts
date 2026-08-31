import type { TelemetryConfig } from '../../types/report.js';
import { stringOrNull } from '../../utils/env-value.js';

export function collectFilesConfig(env: Record<string, unknown>): TelemetryConfig['files'] {
	return {
		max_upload_size: stringOrNull(env['FILES_MAX_UPLOAD_SIZE']),
		import_max_file_size: stringOrNull(env['IMPORT_MAX_FILE_SIZE']),
	};
}
