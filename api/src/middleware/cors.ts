import { useEnv } from '@directus/env';
import cors from 'cors';
import type { RequestHandler } from 'express';

let corsMiddleware: RequestHandler = (_req, _res, next) => next();

const env = useEnv();

/** Headers the 2026-07-28 MCP protocol requires on every request, allowed on /mcp even with a custom allowlist */
const MCP_HEADERS = ['MCP-Protocol-Version', 'Mcp-Method', 'Mcp-Name'];

if (env['CORS_ENABLED'] === true) {
	const options = {
		origin: env['CORS_ORIGIN'] as boolean | string,
		methods: env.CORS_METHODS,
		allowedHeaders: env.CORS_ALLOWED_HEADERS,
		exposedHeaders: env.CORS_EXPOSED_HEADERS,
		credentials: env.CORS_CREDENTIALS,
		maxAge: env.CORS_MAX_AGE,
	};

	// "string:" env values arrive as one comma-separated string
	const allowedHeaders: string[] | undefined =
		typeof options.allowedHeaders === 'string'
			? (options.allowedHeaders as string)
					.split(',')
					.map((header) => header.trim())
					.filter(Boolean)
			: options.allowedHeaders;

	// Without an allowlist, cors already reflects whatever headers the client asks for
	const mcpOptions = allowedHeaders?.length
		? { ...options, allowedHeaders: [...allowedHeaders, ...MCP_HEADERS] }
		: options;

	corsMiddleware = cors((req, callback) => {
		// Raw path, like the router sees it (case-insensitive, trailing slashes allowed)
		const isMcp = /^\/mcp\/*$/i.test((req.url ?? '').split('?')[0]!);

		callback(null, isMcp ? mcpOptions : options);
	});
}

export default corsMiddleware;
