import { useEnv } from '@directus/env';
import { InvalidPayloadError, isDirectusError } from '@directus/errors';

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

/** Check if a request path targets the concrete MCP endpoint. */
export function isMcpPath(path: string): boolean {
	return path === '/mcp' || path === '/mcp/';
}

/**
 * RFC 6750 / RFC 9728 WWW-Authenticate header for MCP OAuth responses.
 */
export function buildMcpWWWAuthenticateHeader(metadataUrl: string, error?: string): string {
	let header = `Bearer resource_metadata="${metadataUrl}", scope="${MCP_ACCESS_SCOPE}"`;
	if (error) header += `, error="${error}"`;
	return header;
}

export type NormalizedMcpError = {
	message: string;
	code?: string;
	recoverable: boolean;
};

function normalizeMcpError(error: unknown): NormalizedMcpError {
	if (isDirectusError(error)) {
		return {
			message: error.message || 'Unknown error',
			code: error.code,
			recoverable: error instanceof InvalidPayloadError,
		};
	}

	const isObject = typeof error === 'object' && error !== null;
	const code = isObject && 'code' in error && error.code ? String(error.code) : undefined;

	let message = 'An unknown error occurred.';

	if (isObject && 'message' in error) {
		message = String(error.message);
	} else if (typeof error === 'string') {
		message = error;
	}

	return { message, ...(code && { code }), recoverable: false };
}

/**
 * Normalize a thrown value into one entry per error. Payload validation throws an array holding a
 * FailedValidationError per failing field, so a single throw can yield several entries.
 */
export function normalizeMcpErrors(error: unknown): NormalizedMcpError[] {
	const errors: unknown[] = Array.isArray(error) && error.length > 0 ? error : [error];

	return errors.map(normalizeMcpError);
}
