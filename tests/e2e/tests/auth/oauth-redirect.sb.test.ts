import { type sandbox as Sandbox, sandbox } from '@directus/sandbox';
import { database } from '@utils/constants.js';
import { getUID } from '@utils/getUID.js';
import { sandboxPort } from '@utils/sandbox-port.js';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';

/**
 * An OAuth provider has to be configured before `/auth/login/github` exists at all, and single
 * sign on is an entitlement, so the mock license server has to be up for it to register.
 */
const github = {
	LICENSE_KEY: 'D0000-00000-00000-00000-0000K',
	AUTH_PROVIDERS: 'github',
	AUTH_GITHUB_DRIVER: 'oauth2',
	AUTH_GITHUB_CLIENT_ID: 'test-client-id',
	AUTH_GITHUB_CLIENT_SECRET: 'test-client-secret',
	AUTH_GITHUB_AUTHORIZE_URL: 'https://github.com/login/oauth/authorize',
	AUTH_GITHUB_ACCESS_URL: 'https://github.com/login/oauth/access_token',
	AUTH_GITHUB_PROFILE_URL: 'https://api.github.com/user',
};

/** Pulls the `redirect_uri` the API asked the provider to call back on. */
function callbackUrl(location: string) {
	return decodeURIComponent(location.split('redirect_uri=')[1]!.split('&')[0]!);
}

function login(base: string, redirect?: string) {
	return fetch(`${base}/auth/login/github${redirect === undefined ? '' : `?redirect=${redirect}`}`, {
		redirect: 'manual',
	});
}

describe('an instance served from the root of its public url', () => {
	let directus: Awaited<ReturnType<typeof Sandbox>>;
	let url: string;

	beforeAll(async () => {
		directus = await sandbox(database, {
			inspect: false,
			prefix: 'oauth-root',
			port: sandboxPort(0),
			extras: { license: true },
			env: { ...github, DB_FILENAME: `directus_test_${getUID()}_root.db` },
			docker: { suffix: `${getUID()}root` },
		});

		url = directus.env.PUBLIC_URL;
	}, 120_000);

	afterAll(async () => {
		await directus.stop();
	});

	const BLOCKED = [
		{ description: 'an unlisted absolute url', redirect: 'https://malicious.com/steal' },
		{ description: 'a protocol relative url', redirect: '//malicious.com/steal' },
	];

	for (const { description, redirect } of BLOCKED) {
		test(`refuses to redirect to ${description}`, async () => {
			const response = await login(url, redirect);

			expect(response.status).toBe(400);
			expect((await response.json()).errors[0].extensions.code).toBe('INVALID_PAYLOAD');
		});
	}

	test('allows a relative path redirect', async () => {
		expect((await login(url, '/admin/content')).status).toBe(302);
	});

	test('allows a redirect back to its own origin', async () => {
		expect((await login(url, `${url}/admin/content`)).status).toBe(302);
	});

	test('allows no redirect at all', async () => {
		expect((await login(url)).status).toBe(302);
	});

	test('asks the provider to call back on its own public url', async () => {
		const response = await login(url, '/admin');

		expect(response.status).toBe(302);
		expect(callbackUrl(response.headers.get('location')!)).toBe(`${url}/auth/login/github/callback`);
	});
});

describe('an instance served from a subpath of its public url', () => {
	let directus: Awaited<ReturnType<typeof Sandbox>>;
	let port: number;

	const allowed = 'https://external-frontend.com/callback';

	beforeAll(async () => {
		port = sandboxPort(1);

		directus = await sandbox(database, {
			inspect: false,
			prefix: 'oauth-subpath',
			port,
			extras: { license: true },
			env: {
				...github,
				PUBLIC_URL: `http://127.0.0.1:${port}/api`,
				AUTH_ALLOWED_PUBLIC_URLS: `http://127.0.0.1:${port}/api,http://localhost:${port}/api`,
				AUTH_GITHUB_REDIRECT_ALLOW_LIST: allowed,
				DB_FILENAME: `directus_test_${getUID()}_subpath.db`,
			},
			docker: { suffix: `${getUID()}subpath` },
		});
	}, 120_000);

	afterAll(async () => {
		await directus.stop();
	});

	test('keeps the subpath in the callback url', async () => {
		const response = await login(`http://127.0.0.1:${port}`, '/admin');

		expect(response.status).toBe(302);

		expect(callbackUrl(response.headers.get('location')!)).toBe(
			`http://127.0.0.1:${port}/api/auth/login/github/callback`,
		);
	});

	test('builds the callback url from whichever allowed public url was asked for', async () => {
		const response = await login(`http://localhost:${port}`, '/admin');

		expect(response.status).toBe(302);

		expect(callbackUrl(response.headers.get('location')!)).toBe(
			`http://localhost:${port}/api/auth/login/github/callback`,
		);
	});

	test('allows a cross domain redirect that is on the allow list', async () => {
		const response = await login(`http://127.0.0.1:${port}`, allowed);

		expect(response.status).toBe(302);
		expect(response.headers.get('location')).toContain('github.com');
	});

	test('refuses a cross domain redirect that is not on the allow list', async () => {
		const response = await login(`http://127.0.0.1:${port}`, 'https://malicious.com/steal');

		expect(response.status).toBe(400);
		expect((await response.json()).errors[0].extensions.code).toBe('INVALID_PAYLOAD');
	});

	test('allows a redirect to its own origin without needing the allow list', async () => {
		const response = await login(`http://127.0.0.1:${port}`, `http://127.0.0.1:${port}/api/admin`);

		expect(response.status).toBe(302);
		expect(response.headers.get('location')).toContain('github.com');
	});
});
