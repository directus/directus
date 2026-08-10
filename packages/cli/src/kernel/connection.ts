import {
	authentication,
	type AuthenticationData,
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
import { credentialStorage, registerSession, type ResolvedCredential } from './config/credentials.js';
import { CliError } from './error.js';
import { registerSecret } from './secret.js';

export interface Identity {
	readonly user: string;
	readonly role: string;
	readonly projectName: string | undefined;
}

const REQUEST_TIMEOUT_MS = 30_000;

function restWithTimeout(timeoutMs: number = REQUEST_TIMEOUT_MS) {
	return rest({ onRequest: (options) => ({ ...options, signal: AbortSignal.timeout(timeoutMs) }) });
}

export function connect(credential: ResolvedCredential, options?: { timeoutMs?: number }): RestClient<CoreSchema> {
	if (credential.kind === 'session') {
		return createDirectus<CoreSchema>(credential.url)
			.with(
				authentication('json', {
					autoRefresh: false,
					storage: credentialStorage(credential.url, credential.profileName),
				}),
			)
			.with(restWithTimeout(options?.timeoutMs));
	}

	registerSecret(credential.token);

	return createDirectus<CoreSchema>(credential.url)
		.with(restWithTimeout(options?.timeoutMs))
		.with(staticToken(credential.token));
}

export async function testConnection(credential: ResolvedCredential): Promise<Identity> {
	return identify(connect(credential), credential.url);
}

export async function pingServer(url: string): Promise<void> {
	const client = createDirectus<CoreSchema>(url).with(restWithTimeout());

	try {
		await client.request(serverPing());
	} catch (error) {
		throw mapRequestError(error, url);
	}
}

export interface VerifiedLogin {
	readonly identity: Identity;
	readonly session: AuthenticationData;
}

/**
 * Stores nothing: the caller persists the session only after the configuration write that binds it to a
 * profile, so a failed write cannot orphan a credential no profile can reach.
 */
export async function loginSession(url: string, email: string, password: string): Promise<VerifiedLogin> {
	registerSecret(password);

	// In-memory storage, so a failed identify leaves nothing behind and a transient one can no longer
	// delete a working saved session.
	let session: AuthenticationData | null = null;

	const client = createDirectus<CoreSchema>(url)
		.with(
			authentication('json', {
				autoRefresh: false,
				storage: {
					get: () => session,
					set: (value) => {
						session = value;
						// The credential store redacts when it persists, but identify() runs long before that:
						// register at issue time so a failing /users/me cannot echo the token in the clear.
						if (value !== null) registerSession(value);
					},
				},
			}),
		)
		.with(restWithTimeout());

	try {
		await client.login({ email, password });
	} catch (error) {
		throw mapRequestError(error, url);
	}

	// The SDK writes the issued tokens to the storage above; nothing there means no session was issued.
	if (session === null) throw new CliError('AUTH', `Login to ${url} returned no session.`);

	return { identity: await identify(client, url), session };
}

// A session refreshes once per command, so anything expiring inside this window would die mid-run.
const SESSION_REFRESH_SKEW_MS = 60_000;

export async function refreshSessionIfNeeded(credential: ResolvedCredential): Promise<void> {
	if (credential.kind !== 'session') return;

	const storage = credentialStorage(credential.url, credential.profileName);
	const data = await storage.get();

	if (data === null) return;

	const expiring = data.expires_at !== null && data.expires_at <= Date.now() + SESSION_REFRESH_SKEW_MS;

	if (data.access_token !== null && !expiring) return;

	const client = createDirectus<CoreSchema>(credential.url)
		.with(authentication('json', { autoRefresh: false, storage }))
		.with(restWithTimeout());

	try {
		await client.refresh();
	} catch (error) {
		const mapped = mapRequestError(error, credential.url);

		// Only an auth rejection proves the refresh token is dead.
		if (mapped.code !== 'AUTH') throw mapped;

		throw new CliError('AUTH', `The saved session for profile "${credential.profileName}" has expired.`, {
			hint: `Sign in again: d6s profile test-connection ${credential.profileName}`,
			...(mapped.detail !== undefined ? { detail: mapped.detail } : {}),
		});
	}
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

// Defensive because the SDK types are loose without a schema, and a raw object must never reach output.
function describeIdentity(me: unknown, projectName: string | undefined): Identity {
	const asString = (value: unknown): string => (typeof value === 'string' ? value : '');

	const name = `${asString(get(me, 'first_name'))} ${asString(get(me, 'last_name'))}`.trim();
	const user = name || asString(get(me, 'email')) || 'unknown user';

	const roleValue = get(me, 'role.name') ?? get(me, 'role');
	const role = asString(roleValue) || 'unknown role';

	return { user, role, projectName };
}

async function rawAuthenticatedGet(
	credential: ResolvedCredential,
	path: string,
	query: Readonly<Record<string, string>> = {},
): Promise<unknown> {
	try {
		const token =
			credential.kind === 'token'
				? credential.token
				: (await credentialStorage(credential.url, credential.profileName).get())?.access_token;

		if (token === undefined || token === null) return undefined;

		const url = new URL(`${credential.url.replace(/\/+$/, '')}${path}`);
		for (const [name, value] of Object.entries(query)) url.searchParams.set(name, value);

		const response = await fetch(url, {
			headers: { authorization: `Bearer ${token}` },
			signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
		});

		return response.ok ? await response.json() : undefined;
	} catch {
		return undefined;
	}
}

async function serverInfoValue(credential: ResolvedCredential, path: string): Promise<unknown> {
	try {
		return get(await connect(credential).request(serverInfo()), path);
	} catch {
		return undefined;
	}
}

/**
 * A raw request because the SDK strips the response envelope, losing `meta`. For an admin token
 * total_count is computed on the database, so it counts records that entitlement filtering hides from list
 * reads — which is what makes it a pull completeness check. Best-effort: failure disables the check only.
 */
export async function fetchTotalCount(credential: ResolvedCredential, path: string): Promise<number | undefined> {
	const total = get(
		await rawAuthenticatedGet(credential, path, { limit: '0', meta: 'total_count' }),
		'meta.total_count',
	);

	return typeof total === 'number' ? total : undefined;
}

/** Best-effort: this only feeds a version-skew warning, so an unreadable value never gates the sync. */
export async function fetchServerVersion(credential: ResolvedCredential): Promise<string | undefined> {
	const version = await serverInfoValue(credential, 'version');
	return typeof version === 'string' ? version : undefined;
}

/**
 * `queryLimit.max`: -1 is no cap, a positive N is the hard page cap, 0 refuses everything. Lets the fetch
 * layer skip its exhaustion probe on an unbounded instance; undefined just falls back to probing.
 */
export async function fetchQueryLimitMax(credential: ResolvedCredential): Promise<number | undefined> {
	const max = await serverInfoValue(credential, 'queryLimit.max');
	return typeof max === 'number' ? max : undefined;
}

/**
 * Read from the admin-only `/license` endpoint. When false the server filters custom-rule permissions out
 * of reads, which is what makes a `/permissions` pull incomplete. Best-effort: a non-admin 403, an older
 * server without the endpoint, or any transient failure returns undefined and the caller infers instead.
 */
export async function fetchCustomPermissionRulesEntitled(credential: ResolvedCredential): Promise<boolean | undefined> {
	const body = await rawAuthenticatedGet(credential, '/license');
	const override = get(body, 'data.entitlements.custom_permission_rules_enabled.override');
	const fallback = get(body, 'data.entitlements.custom_permission_rules_enabled.default');
	const value = override ?? fallback;

	return typeof value === 'boolean' ? value : undefined;
}

const AUTH_CODES = new Set(['INVALID_CREDENTIALS', 'INVALID_TOKEN', 'TOKEN_EXPIRED', 'INVALID_OTP', 'FORBIDDEN']);

/** Never retain the raw Response: it carries the Authorization header. */
export function mapRequestError(error: unknown, url: string): CliError {
	if (isDirectusError(error)) {
		const rawStatus = get(error.response, 'status');
		const status = typeof rawStatus === 'number' ? rawStatus : undefined;
		const code = error.errors[0]?.extensions.code;
		const detail = error.errors.map((entry) => `${entry.extensions.code}: ${entry.message}`).join('; ');
		// Directus also uses 403 for non-auth refusals such as license limits, so the status alone is not
		// enough; prefer the structured code so those failures keep their real cause and remediation.
		const isAuth = status === 401 || (code !== undefined ? AUTH_CODES.has(code) : status === 403);

		if (isAuth) {
			return new CliError('AUTH', `Authentication failed for ${url}.`, {
				hint: 'Check the token or credentials for this profile.',
				...(detail !== '' ? { detail } : {}),
			});
		}

		if (code === 'LIMIT_EXCEEDED') {
			return new CliError('HTTP', `Instance limit exceeded for ${url}.`, {
				hint: 'Reduce the limited resources or update the instance license, then retry.',
				...(detail !== '' ? { detail } : {}),
			});
		}

		return new CliError('HTTP', `Request to ${url} failed${status !== undefined ? ` (HTTP ${status})` : ''}.`, {
			...(detail !== '' ? { detail } : {}),
		});
	}

	const reason = error instanceof Error ? error.message : String(error);
	return new CliError('HTTP', `Could not reach ${url}.`, { detail: reason });
}
