import { createDirectus, isDirectusError, readMe, rest, serverInfo, staticToken } from '@directus/sdk';
import { CliError } from '../error.js';
import { registerSecret } from '../secret.js';
import type { ResolvedCredential } from './credentials.js';

export interface Identity {
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
			const info = (await client.request(serverInfo())) as { project?: { project_name?: unknown } };
			if (typeof info.project?.project_name === 'string') projectName = info.project.project_name;
		} catch {
			// Server info is best-effort; readMe already proved authentication.
		}

		return describeIdentity(me, projectName);
	} catch (error) {
		throw mapRequestError(error, credential.url);
	}
}

function firstNonEmpty(...values: string[]): string {
	for (const value of values) {
		if (value !== '') return value;
	}

	return '';
}

// Turn a /users/me-shaped record into display strings, defensively — the SDK
// types are loose without a schema and we never want to render a raw object.
export function describeIdentity(me: unknown, projectName: string | undefined): Identity {
	const record: Record<string, unknown> = typeof me === 'object' && me !== null ? (me as Record<string, unknown>) : {};

	const first = typeof record['first_name'] === 'string' ? record['first_name'] : '';
	const last = typeof record['last_name'] === 'string' ? record['last_name'] : '';
	const email = typeof record['email'] === 'string' ? record['email'] : '';
	const user = firstNonEmpty(`${first} ${last}`.trim(), email) || 'unknown user';

	const roleValue = record['role'];
	let role = 'unknown role';

	if (typeof roleValue === 'string') {
		role = roleValue;
	} else if (typeof roleValue === 'object' && roleValue !== null && 'name' in roleValue) {
		const roleName = (roleValue as Record<string, unknown>)['name'];
		if (typeof roleName === 'string') role = roleName;
	}

	return { user, role, projectName };
}

const AUTH_CODES = new Set(['INVALID_CREDENTIALS', 'INVALID_TOKEN', 'TOKEN_EXPIRED', 'INVALID_OTP', 'FORBIDDEN']);

function statusOf(response: unknown): number | undefined {
	if (response !== null && typeof response === 'object' && 'status' in response) {
		const status = (response as Record<string, unknown>)['status'];
		if (typeof status === 'number') return status;
	}

	return undefined;
}

// Map an SDK/HTTP failure into a CliError. `detail` is built from safe fields
// only (Directus error codes/messages + HTTP status) — never the raw Response,
// which carries the Authorization header. So diagnostics survive without the
// token ever entering the error object we keep.
export function mapRequestError(error: unknown, url: string): CliError {
	if (isDirectusError(error)) {
		const status = statusOf(error.response);
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
