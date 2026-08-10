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

/** A verified login: the identity it proved, plus the session the caller persists once its profile is written. */
export interface VerifiedLogin {
	readonly identity: Identity;
	readonly session: AuthenticationData;
}

/**
 * Log in and prove the session works, without storing anything. The caller persists it — after whatever
 * configuration write binds it to a profile, so a failed write cannot orphan a credential no profile can reach.
 */
export async function loginSession(url: string, email: string, password: string): Promise<VerifiedLogin> {
	registerSecret(password);

	// Log in against memory so nothing is written until the session is proven usable: a failed identify
	// leaves nothing behind, and a transient one can no longer delete a working saved session.
	let session: AuthenticationData | null = null;

	const client = createDirectus<CoreSchema>(url)
		.with(
			authentication('json', {
				autoRefresh: false,
				storage: {
					get: () => session,
					set: (value) => {
						session = value;
						// Redaction is the credential store's job when it persists, but identify() runs long before
						// the caller gets there — register at issue time so a failing /users/me that echoes the
						// token cannot print it in the clear.
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

	// The SDK hands the issued tokens to the storage above; nothing there means there is no session to keep.
	if (session === null) throw new CliError('AUTH', `Login to ${url} returned no session.`);

	return { identity: await identify(client, url), session };
}

// Refresh once per command so every later client reads the rotated session from shared storage.
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

// Turn a /users/me-shaped record into display strings, defensively — the SDK
// types are loose without a schema and we never want to render a raw object.
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
 * Total stored records behind a list endpoint via `meta=total_count`, or undefined when the server cannot
 * answer. This is a raw request on purpose: the SDK strips the response envelope (extract-data returns
 * `data`), losing `meta`. For an admin token total_count is computed straight on the database — it counts
 * records that entitlement filtering hides from list reads, which is exactly what makes it usable as an
 * pull completeness check. Best-effort: any failure disables the check, never the caller.
 */
export async function fetchTotalCount(credential: ResolvedCredential, path: string): Promise<number | undefined> {
	const total = get(
		await rawAuthenticatedGet(credential, path, { limit: '0', meta: 'total_count' }),
		'meta.total_count',
	);

	return typeof total === 'number' ? total : undefined;
}

/**
 * The instance's Directus version from `/server/info` (`version` is visible to any authenticated user),
 * or undefined when it cannot be read. Best-effort on purpose: this only feeds a source/target version
 * skew warning, so a missing field, an older server, or any transient failure degrades to "no warning" and
 * NEVER gates the sync.
 */
export async function fetchServerVersion(credential: ResolvedCredential): Promise<string | undefined> {
	const version = await serverInfoValue(credential, 'version');
	return typeof version === 'string' ? version : undefined;
}

/**
 * The instance's `queryLimit.max` from `/server/info` (visible to any authenticated user): `-1` means no
 * cap, a positive N is the hard page cap, `0` refuses everything. Undefined when it can't be read. Lets the
 * fetch layer skip the exhaustion probe on an unbounded instance; a missing value degrades to today's
 * probe-based paging, so this is best-effort and never gates.
 */
export async function fetchQueryLimitMax(credential: ResolvedCredential): Promise<number | undefined> {
	const max = await serverInfoValue(credential, 'queryLimit.max');
	return typeof max === 'number' ? max : undefined;
}

/**
 * Whether the instance is licensed for custom permission rules, read from the admin-only `/license`
 * endpoint (`entitlements.custom_permission_rules_enabled`, `override ?? default`). When false the server
 * filters custom-rule permissions out of reads, which is exactly what makes a `/permissions` pull
 * incomplete. Best-effort: a non-admin 403, an older server without the endpoint, or any transient failure
 * returns undefined, and the caller degrades to inference — it NEVER gates on this. Raw fetch because the
 * SDK strips the response envelope this reads from (same reason as fetchTotalCount).
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
		// Directus also uses 403 for non-auth refusals such as license limits. Prefer the structured
		// error code whenever present so those failures keep their real cause and remediation.
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
