import { toBoolean } from '@directus/utils';
import type { TelemetryReport } from '../../types/report.js';

export function collectExtensionsConfig(env: Record<string, unknown>): TelemetryReport['config']['extensions'] {
	return {
		must_load: toBoolean(env['EXTENSIONS_MUST_LOAD'] ?? false),
		auto_reload: toBoolean(env['EXTENSIONS_AUTO_RELOAD'] ?? false),
		cache_ttl: typeof env['EXTENSIONS_CACHE_TTL'] === 'string' ? env['EXTENSIONS_CACHE_TTL'] : false,
		limit: env['EXTENSIONS_LIMIT'] ? Number(env['EXTENSIONS_LIMIT']) : false,
		rolldown: toBoolean(env['EXTENSIONS_ROLLDOWN'] ?? false),
	};
}
