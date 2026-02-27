import { useEnv } from '@directus/env';
import { toBoolean } from '@directus/utils';
import type { Knex } from 'knex';
import type { TelemetryReport } from '../types/report.js';
import { collectAuthProviders } from './config/auth.js';
import { collectCache } from './config/cache.js';
import { collectDatabase } from './config/database.js';
import { collectEmail } from './config/email.js';
import { collectExtensionsConfig } from './config/extensions.js';
import { collectMarketplace } from './config/marketplace.js';
import { collectPm2 } from './config/pm2.js';
import { collectPrometheus } from './config/prometheus.js';
import { collectRateLimit } from './config/rate-limit.js';
import { collectRetention } from './config/retention.js';
import { collectStorage } from './config/storage.js';
import { collectSyncStore } from './config/sync.js';
import { collectWebsocket } from './config/websocket.js';

export async function collectConfig(db: Knex): Promise<TelemetryReport['config']> {
	const env = useEnv();

	return {
		auth: collectAuthProviders(env),
		ai: toBoolean(env['AI_ENABLED']),
		mcp: toBoolean(env['MCP_ENABLED']),
		cache: collectCache(env),
		database: await collectDatabase(db),
		email: collectEmail(env),
		extensions: collectExtensionsConfig(env),
		marketplace: collectMarketplace(env),
		storage: collectStorage(env),
		retention: collectRetention(env),
		websockets: collectWebsocket(env),
		prometheus: collectPrometheus(env),
		rate_limiting: collectRateLimit(env),
		synchronization: collectSyncStore(env),
		pm2: collectPm2(env),
	};
}
