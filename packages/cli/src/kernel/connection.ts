import {
	authentication,
	type CoreSchema,
	createDirectus,
	isDirectusError,
	readMe,
	rest,
	type RestClient,
	serverInfo,
	serverPing,
	staticToken,
} from '@directus/sdk';
import { get } from 'lodash-es';
import { credentialStorage, type ResolvedCredential } from './config/credentials.js';
import { CliError } from './error.js';
import { registerSecret } from './secret.js';

export interface Identity {
	readonly user: string;
	readonly role: string;
	readonly projectName: string | undefined;
}

// Every REST request gets a hard timeout so a blackholed or wrong host fails fast
// instead of hanging a CI job forever. AbortSignal.timeout's timer is unref'd, so
// unlike the auth refresh timer it never keeps the process alive after a success.
// (Covers rest() calls — readMe/serverInfo/serverPing; the auth composable's own
// login/refresh fetch is a separate path, exercised only in interactive login.)
const REQUEST_TIMEOUT_MS = 30_000;

function restWithTimeout() {
	return rest({ onRequest: (options) => ({ ...options, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) }) });
}

function connect(credential: ResolvedCredential): RestClient<CoreSchema> {
	if (credential.source === 'session') {
		return createDirectus<CoreSchema>(credential.url)
			.with(sessionAuth(credential.url, credential.profileName))
			.with(restWithTimeout());
	}

	// Registered before the client exists, so anything it surfaces in — including
	// an error's request context — is redacted.
	registerSecret(credential.token);
	return createDirectus<CoreSchema>(credential.url).with(restWithTimeout()).with(staticToken(credential.token));
}

// One-shot session auth: autoRefresh OFF so the SDK schedules no background refresh
// timer, which would otherwise keep the CLI process alive after the command exits.
// getToken still refreshes a stale session lazily on the next request, so a
// persisted session stays usable.
function sessionAuth(url: string, profileName: string) {
	return authentication('json', { storage: credentialStorage(url, profileName), autoRefresh: false });
}

// Prove the credential works and return safe identity info for display — never
// the token.
export async function testConnection(credential: ResolvedCredential): Promise<Identity> {
	return identify(connect(credential), credential.url);
}

// Unauthenticated reachability probe, so a URL typo is caught at `add` time
// instead of on the first real request.
export async function pingServer(url: string): Promise<void> {
	const client = createDirectus<CoreSchema>(url).with(restWithTimeout());

	try {
		await client.request(serverPing());
	} catch (error) {
		throw mapRequestError(error, url);
	}
}

// The interactive email/password bootstrap: log in and let the store-backed
// session storage persist the resulting refresh-token session for this profile.
// The password is used for the one login call and never stored — only the
// rotating session is. Unlike a static token this never touches directus_users,
// so it can't clobber a token another integration relies on.
export async function loginSession(
	url: string,
	profileName: string,
	email: string,
	password: string,
): Promise<Identity> {
	registerSecret(password);

	const client = createDirectus<CoreSchema>(url).with(sessionAuth(url, profileName)).with(restWithTimeout());

	try {
		await client.login({ email, password });
	} catch (error) {
		throw mapRequestError(error, url);
	}

	return identify(client, url);
}

async function identify(client: RestClient<CoreSchema>, url: string): Promise<Identity> {
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
		throw mapRequestError(error, url);
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
