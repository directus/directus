import { createDirectus, isDirectusError, readMe, rest, serverInfo, staticToken } from '@directus/sdk';
import { get } from 'lodash-es';
import { CliError } from '../error.js';
import { registerSecret } from '../secret.js';
import type { ResolvedCredential } from './credentials.js';

interface Identity {
	readonly user: string;
	readonly role: string;
	readonly projectName: string | undefined;
}

// Build a static-token REST client. The token is registered as a secret first so
// anything it surfaces in — including an error's request context — is redacted.
function makeClient(credential: ResolvedCredential) {
	registerSecret(credential.token);
	return createDirectus(credential.url).with(rest()).with(staticToken(credential.token));
}

// Prove the credential works and return safe identity info for display — never
// the token. Used by `profile test` and, later, pre-flight target checks.
export async function testConnection(credential: ResolvedCredential): Promise<Identity> {
	const client = makeClient(credential);

	try {
		const me: unknown = await client.request(
			readMe({ fields: ['first_name', 'last_name', 'email', { role: ['name'] }] }),
		);

		let projectName: string | undefined;

		try {
			const name = get(await client.request(serverInfo()), 'project.project_name');
			if (typeof name === 'string') projectName = name;
		} catch {
			// Server info is best-effort; readMe already proved authentication.
		}

		return describeIdentity(me, projectName);
	} catch (error) {
		throw mapRequestError(error, credential.url);
	}
}

// Turn a /users/me-shaped record into display strings, defensively — the SDK
// types are loose without a schema and we never want to render a raw object.
export function describeIdentity(me: unknown, projectName: string | undefined): Identity {
	const asString = (value: unknown): string => (typeof value === 'string' ? value : '');

	const name = `${asString(get(me, 'first_name'))} ${asString(get(me, 'last_name'))}`.trim();
	const user = name || asString(get(me, 'email')) || 'unknown user';

	const roleValue = get(me, 'role.name') ?? get(me, 'role');
	const role = asString(roleValue) || 'unknown role';

	return { user, role, projectName };
}

const AUTH_CODES = new Set(['INVALID_CREDENTIALS', 'INVALID_TOKEN', 'TOKEN_EXPIRED', 'INVALID_OTP', 'FORBIDDEN']);

// Map an SDK/HTTP failure into a CliError. `detail` is built from safe fields
// only (Directus error codes/messages + HTTP status) — never the raw Response,
// which carries the Authorization header. So diagnostics survive without the
// token ever entering the error object we keep.
export function mapRequestError(error: unknown, url: string): CliError {
	if (isDirectusError(error)) {
		const rawStatus = get(error.response, 'status');
		const status = typeof rawStatus === 'number' ? rawStatus : undefined;
		const code = error.errors[0]?.extensions.code;
		const detail = error.errors.map((entry) => `${entry.extensions.code}: ${entry.message}`).join('; ');
		const isAuth = status === 401 || status === 403 || (code !== undefined && AUTH_CODES.has(code));

		if (isAuth) {
			return new CliError('AUTH', `Authentication failed for ${url}.`, {
				hint: 'Check the token or credentials for this profile.',
				...(detail !== '' ? { detail } : {}),
			});
		}

		return new CliError('HTTP', `Request to ${url} failed${status !== undefined ? ` (HTTP ${status})` : ''}.`, {
			...(detail !== '' ? { detail } : {}),
		});
	}

	// No Response at all — DNS failure, connection refused, TLS, etc.
	const reason = error instanceof Error ? error.message : String(error);
	return new CliError('HTTP', `Could not reach ${url}.`, { detail: reason });
}
