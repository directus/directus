import { useEnv } from '@directus/env';

/** The only OAuth scope for MCP access. Used in JWT claims, discovery metadata, and scope validation. */
export const MCP_ACCESS_SCOPE = 'mcp:access';

/**
 * Canonical MCP resource and discovery URLs derived from PUBLIC_URL.
 */
export function getMcpUrls(): { issuerUrl: string; resourceUrl: string; metadataUrl: string } {
	const base = (useEnv()['PUBLIC_URL'] as string).replace(/\/+$/, '');

	return {
		issuerUrl: base || '/',
		resourceUrl: `${base}/mcp`,
		metadataUrl: `${base}/.well-known/oauth-protected-resource/mcp`,
	};
}

/** Check if a request path targets the MCP endpoint. Includes `/mcp/*` for forward compatibility with sub-paths. */
export function isMcpPath(path: string): boolean {
	return path === '/mcp' || path.startsWith('/mcp/');
}

/**
 * RFC 6750 / RFC 9728 WWW-Authenticate header for MCP OAuth responses.
 */
export function buildMcpWWWAuthenticateHeader(metadataUrl: string, error?: string): string {
	let header = `Bearer resource_metadata="${metadataUrl}", scope="${MCP_ACCESS_SCOPE}"`;
	if (error) header += `, error="${error}"`;
	return header;
}
