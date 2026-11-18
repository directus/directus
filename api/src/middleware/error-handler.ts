import { useEnv } from '@directus/env';
import { ErrorCode, InternalServerError, isDirectusError } from '@directus/errors';
import type { DeepPartial } from '@directus/types';
import { isObject, toBoolean } from '@directus/utils';
import { getNodeEnv } from '@directus/utils/node';
import type { ErrorRequestHandler } from 'express';
import { buildMcpWWWAuthenticateHeader as buildMcpChallengeHeader, getMcpUrls, isMcpPath } from '../ai/mcp/utils.js';
import getDatabase from '../database/index.js';
import emitter from '../emitter.js';
import { useLogger } from '../logger/index.js';

type ApiError = {
	message: string;
	extensions: {
		code: string;
		[key: string]: any;
	};
};

const FALLBACK_ERROR = new InternalServerError();

/** Project settings, so projects without MCP or with MCP OAuth off keep Directus's usual 401 */
async function isMcpOAuthSettingOn(): Promise<boolean> {
	try {
		const settings = await getDatabase()('directus_settings').select('mcp_enabled', 'mcp_oauth_enabled').first();
		return toBoolean(settings?.mcp_enabled) && toBoolean(settings?.mcp_oauth_enabled);
	} catch {
		return false;
	}
}

export const errorHandler = asyncErrorHandler(async (err, req, res) => {
	const { MCP_OAUTH_ENABLED } = useEnv();
	const logger = useLogger();

	let errors: ApiError[] = [];
	let status: number | null = null;

	// It can be assumed that at least one error is given
	const receivedErrors: unknown[] = Array.isArray(err) ? err : [err];

	for (const error of receivedErrors) {
		// MCP OAuth: return RFC 6750 WWW-Authenticate on 401 for /mcp paths.
		// This catches expired/invalid tokens that fail in the authenticate middleware
		// BEFORE the request reaches the MCP server. The MCP server handles the "no
		// credentials" case itself; this handles "bad credentials" from upstream.
		if (
			(isDirectusError(error, ErrorCode.InvalidCredentials) ||
				isDirectusError(error, ErrorCode.InvalidToken) ||
				isDirectusError(error, ErrorCode.TokenExpired)) &&
			isMcpPath(req.path) &&
			MCP_OAUTH_ENABLED &&
			(await isMcpOAuthSettingOn())
		) {
			const { metadataUrl } = getMcpUrls();

			res
				.status(401)
				.set('WWW-Authenticate', buildMcpChallengeHeader(metadataUrl, 'invalid_token'))
				.set('Access-Control-Expose-Headers', 'WWW-Authenticate')
				.json({ error: 'invalid_token', error_description: error.message });

			return;
		}

		// In dev mode, if available, expose stack trace under error's extensions data
		if (getNodeEnv() === 'development' && error instanceof Error && error.stack) {
			((error as DeepPartial<ApiError>).extensions ??= {})['stack'] = error.stack;
		}

		if (isDirectusError(error)) {
			logger.debug(error);

			if (status === null) {
				// Use current error status as response status
				status = error.status;
			} else if (status !== error.status) {
				// Fallback if status has already been set by a preceding error
				// and doesn't match the current one
				status = FALLBACK_ERROR.status;
			}

			errors.push({
				message: error.message,
				extensions: {
					...(error.extensions ?? {}),
					// Expose error code under error's extensions data
					code: error.code,
				},
			});

			if (isDirectusError(error, ErrorCode.MethodNotAllowed)) {
				res.header('Allow', error.extensions.allowed.join(', '));
			}
		} else {
			logger.error(error);

			status = FALLBACK_ERROR.status;

			if (req.accountability?.admin === true) {
				const localError = isObject(error) ? error : {};

				// Use 'message' prop if available, otherwise if 'error' is a string use that
				const message =
					(typeof localError['message'] === 'string' ? localError['message'] : null) ??
					(typeof error === 'string' ? error : null);

				errors = [
					{
						message: message || FALLBACK_ERROR.message,
						extensions: {
							code: FALLBACK_ERROR.code,
							...(localError['extensions'] ?? {}),
						},
					},
				];
			} else {
				// Don't expose unknown errors to non-admin users
				errors = [{ message: FALLBACK_ERROR.message, extensions: { code: FALLBACK_ERROR.code } }];
			}
		}
	}

	res.status(status ?? FALLBACK_ERROR.status);

	const updatedErrors = await emitter.emitFilter(
		'request.error',
		errors,
		{},
		{
			database: getDatabase(),
			schema: req.schema,
			accountability: req.accountability ?? null,
		},
	);

	return res.json({ errors: updatedErrors });
});

function asyncErrorHandler(
	fn: (...args: Parameters<ErrorRequestHandler>) => Promise<any>,
): (...args: Parameters<ErrorRequestHandler>) => Promise<ReturnType<ErrorRequestHandler>> {
	return (err, req, res, next) =>
		fn(err, req, res, next).catch((error) => {
			// To be on the safe side and ensure this doesn't lead to an unhandled (potentially crashing) error
			try {
				const logger = useLogger();
				logger.error(error, 'Unexpected error in error handler');
			} catch {
				// Ignore
			}

			// Delegate to default error handler to close the connection
			if (res.headersSent) return next(err);

			res.status(FALLBACK_ERROR.status);
			return res.json({ errors: [{ message: FALLBACK_ERROR.message, extensions: { code: FALLBACK_ERROR.code } }] });
		});
}
