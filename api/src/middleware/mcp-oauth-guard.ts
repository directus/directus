import { ForbiddenError } from '@directus/errors';
import type { NextFunction, Request, Response } from 'express';
import { isMcpPath } from '../ai/mcp/utils.js';

/**
 * OAuth session route guard. If `accountability.oauth` is set, restrict to MCP endpoints only.
 * All other Directus API routes are forbidden. Regular sessions pass through untouched.
 */
export function handler(req: Request, _res: Response, next: NextFunction): void {
	if (!req.accountability?.oauth) {
		next();
		return;
	}

	if (!isMcpPath(req.path)) {
		next(new ForbiddenError());
		return;
	}

	next();
}

export default handler;
