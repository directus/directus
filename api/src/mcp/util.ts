import { useEnv } from '@directus/env';

export function deleteEnabled() {
	const env = useEnv();

	return env['MCP_PREVENT_DELETE'] === false;
}
