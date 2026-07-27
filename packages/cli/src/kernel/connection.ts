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

export async function loginSession(
	url: string,
	profileName: string,
	email: string,
	password: string,
): Promise<Identity> {
	registerSecret(password);

	const storage = credentialStorage(url, profileName);

	const client = createDirectus<CoreSchema>(url)
		.with(authentication('json', { autoRefresh: false, storage }))
		.with(restWithTimeout());

	try {
		await client.login({ email, password });
	} catch (error) {
		throw mapRequestError(error, url);
	}

	try {
		return await identify(client, url);
	} catch (error) {
		storage.set(null);
		throw error;
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

/**
 * Total stored rows behind a list endpoint via `meta=total_count`, or undefined when the server cannot
 * answer. This is a raw request on purpose: the SDK strips the response envelope (extract-data returns
 * `data`), losing `meta`. For an admin token total_count is computed straight on the database — it counts
 * rows that entitlement filtering hides from list reads, which is exactly what makes it usable as an
 * export completeness check. Best-effort: any failure disables the check, never the caller.
 */
export async function fetchTotalCount(credential: ResolvedCredential, path: string): Promise<number | undefined> {
	const token =
		credential.kind === 'token'
			? credential.token
			: (await credentialStorage(credential.url, credential.profileName).get())?.access_token;

	if (token === undefined || token === null) return undefined;

	const url = new URL(`${credential.url.replace(/\/+$/, '')}${path}`);
	url.searchParams.set('limit', '0');
	url.searchParams.set('meta', 'total_count');

	try {
		const response = await fetch(url, {
			headers: { authorization: `Bearer ${token}` },
			signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
		});

		if (!response.ok) return undefined;

		const total = get(await response.json(), 'meta.total_count');
		return typeof total === 'number' ? total : undefined;
	} catch {
		return undefined;
	}
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
			return new CliError('HTTP', `Target limit exceeded for ${url}.`, {
				hint: 'Reduce the limited resources or update the target license, then retry.',
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
