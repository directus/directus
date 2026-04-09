import { useEnv } from '@directus/env';
import { useLogger } from '../logger/index.js';
import { McpOAuthService } from '../services/mcp-oauth.js';
import { getSchema } from '../utils/get-schema.js';
import { scheduleSynchronizedJob, validateCron } from '../utils/schedule.js';

export default async function scheduleOAuthCleanup(): Promise<boolean> {
	const env = useEnv();
	const schedule = String(env['MCP_OAUTH_CLEANUP_SCHEDULE']);

	if (!validateCron(schedule)) {
		useLogger().error(`Invalid MCP_OAUTH_CLEANUP_SCHEDULE: "${schedule}". OAuth cleanup disabled.`);
		return false;
	}

	scheduleSynchronizedJob('oauth-cleanup', schedule, async () => {
		const schema = await getSchema();
		const service = new McpOAuthService({ schema });
		await service.cleanup();
	});

	return true;
}
