import { useEnv } from '@directus/env';
import type { Knex } from 'knex';
import type { TelemetryReport } from '../types/report.js';
import { collectAi } from './config/ai.js';
import { collectAssets } from './config/assets.js';
import { collectAuthProviders } from './config/auth.js';
import { collectCache } from './config/cache.js';
import { collectCors } from './config/cors.js';
import { collectDatabase } from './config/database.js';
import { collectEmail } from './config/email.js';
import { collectExtensionsConfig } from './config/extensions.js';
import { collectFilesConfig } from './config/files.js';
import { collectFlowsConfig } from './config/flows.js';
import { collectGraphql } from './config/graphql.js';
import { collectHealthcheck } from './config/healthcheck.js';
import { collectLicenseConfig } from './config/license.js';
import { collectMarketplace } from './config/marketplace.js';
import { collectMcp } from './config/mcp.js';
import { collectOpenapi } from './config/openapi.js';
import { collectPm2 } from './config/pm2.js';
import { collectPrometheus } from './config/prometheus.js';
import { collectRateLimit } from './config/rate-limit.js';
import { collectRedis } from './config/redis.js';
import { collectRetention } from './config/retention.js';
import { collectStorage } from './config/storage.js';
import { collectSyncStore } from './config/sync.js';
import { collectTelemetryConfig } from './config/telemetry.js';
import { collectWebsocket } from './config/websocket.js';

export async function collectConfig(db: Knex): Promise<TelemetryReport['config']> {
	const env = useEnv();

	return {
		auth: collectAuthProviders(env),
		ai: collectAi(env),
		mcp: collectMcp(env),
		assets: collectAssets(env),
		cache: collectCache(env),
		cors: collectCors(env),
		database: await collectDatabase(db),
		email: collectEmail(env),
		extensions: collectExtensionsConfig(env),
		files: collectFilesConfig(env),
		flows: collectFlowsConfig(env),
		graphql: collectGraphql(env),
		healthcheck: collectHealthcheck(env),
		license: collectLicenseConfig(env),
		marketplace: collectMarketplace(env),
		openapi: collectOpenapi(env),
		storage: collectStorage(env),
		redis: collectRedis(env),
		retention: collectRetention(env),
		telemetry: collectTelemetryConfig(env),
		websockets: collectWebsocket(env),
		prometheus: collectPrometheus(env),
		rate_limiting: collectRateLimit(env),
		synchronization: collectSyncStore(env),
		pm2: collectPm2(env),
	};
}
