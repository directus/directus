import { toBoolean } from '@directus/utils';
import type { TelemetryReport } from '../../types/report.js';
import { numberOrNull } from '../../utils/env-value.js';

export function collectExtensionsConfig(env: Record<string, unknown>): TelemetryReport['config']['extensions'] {
	return {
		must_load: toBoolean(env['EXTENSIONS_MUST_LOAD']),
		auto_reload: toBoolean(env['EXTENSIONS_AUTO_RELOAD']),
		cache_ttl: typeof env['EXTENSIONS_CACHE_TTL'] === 'string' ? env['EXTENSIONS_CACHE_TTL'] : null,
		limit: env['EXTENSIONS_LIMIT'] ? Number(env['EXTENSIONS_LIMIT']) : null,
		rolldown: toBoolean(env['EXTENSIONS_ROLLDOWN']),
		storage_max_concurrency: numberOrNull(env['EXTENSIONS_STORAGE_MAX_CONCURRENCY']),
	};
}
