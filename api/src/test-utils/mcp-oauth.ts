import type { Response } from 'express';
import { expect } from 'vitest';

/**
 * Assert that a response includes the RFC 6750 WWW-Authenticate bearer challenge
 * headers expected for MCP OAuth-protected endpoints.
 */
export function expectMcpBearerChallenge(
	res: Response,
	opts: {
		status: number;
		error?: string;
		resourceMetadata?: string | true;
	},
) {
	expect(res.status).toHaveBeenCalledWith(opts.status);

	if (opts.error) {
		expect(res.set).toHaveBeenCalledWith(
			'WWW-Authenticate',
			expect.stringContaining(`error="${opts.error}"`),
		);
	}

	if (opts.resourceMetadata === true) {
		expect(res.set).toHaveBeenCalledWith(
			'WWW-Authenticate',
			expect.stringContaining('resource_metadata='),
		);
	} else if (typeof opts.resourceMetadata === 'string') {
		expect(res.set).toHaveBeenCalledWith(
			'WWW-Authenticate',
			expect.stringContaining(`resource_metadata="${opts.resourceMetadata}"`),
		);
	}

	expect(res.set).toHaveBeenCalledWith(
		'WWW-Authenticate',
		expect.stringContaining('scope="mcp:access"'),
	);

	expect(res.set).toHaveBeenCalledWith('Access-Control-Expose-Headers', 'WWW-Authenticate');
}
