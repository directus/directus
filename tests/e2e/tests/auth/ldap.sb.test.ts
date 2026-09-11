import { sandbox } from '@directus/sandbox';
import { database } from '@utils/constants.js';
import { getUID } from '@utils/getUID.js';
import { sandboxPort } from '@utils/sandbox-port.js';
import { Client } from 'ldapts';
import { afterAll, expect, test } from 'vitest';

/**
 * Runs against a real directory server, so what is under test is how Directus talks to it:
 * signing a user in, turning them away, and provisioning a Directus user from their entry.
 */
const directus = await sandbox(database, {
	inspect: false,
	prefix: 'ldap',
	port: sandboxPort(),
	// Single sign on is an entitlement, so the provider only registers with a license
	extras: { ldap: true, license: true },
	env: {
		LICENSE_KEY: 'D0000-00000-00000-00000-0000K',
		DB_FILENAME: `directus_test_${getUID()}.db`,
	},
	docker: { suffix: getUID() },
});

const url = `http://localhost:${directus.apis[0]!.port}`;

const BASE_DN = 'dc=my-domain,dc=com';
const USER_DN = `ou=users,${BASE_DN}`;

const USER = {
	uid: 'ldaptestuser',
	password: 'ldaptestpassword',
	email: 'ldaptestuser@example.com',
	firstName: 'LDAP',
	lastName: 'TestUser',
};

const client = new Client({ url: directus.env.AUTH_LDAP_CLIENT_URL!, connectTimeout: 10_000, timeout: 10_000 });

await client.bind(directus.env.AUTH_LDAP_BIND_DN!, directus.env.AUTH_LDAP_BIND_PASSWORD!);

/** Adds an entry, treating "it is already there" as success. */
async function ensure(dn: string, entry: Record<string, unknown>) {
	try {
		await client.add(dn, entry as any);
	} catch (error: any) {
		// 68 is entryAlreadyExists
		if (error?.code !== 68) throw error;
	}
}

await ensure(BASE_DN, { objectClass: ['top', 'domain', 'dcObject'], dc: 'my-domain' });

await ensure(directus.env.AUTH_LDAP_BIND_DN!, {
	objectClass: ['top', 'person', 'organizationalPerson'],
	cn: 'Manager',
	sn: 'Manager',
});

await ensure(USER_DN, { objectClass: ['top', 'organizationalUnit'], ou: 'users' });

await ensure(`cn=${USER.uid},${USER_DN}`, {
	objectClass: ['top', 'inetOrgPerson', 'organizationalPerson', 'person'],
	cn: USER.uid,
	sn: USER.lastName,
	givenName: USER.firstName,
	mail: USER.email,
	uid: USER.uid,
	userPassword: USER.password,
});

afterAll(async () => {
	await client.unbind().catch(() => {});
	await directus.stop();
});

async function login(identifier: string, password: string) {
	const response = await fetch(`${url}/auth/login/ldap`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ identifier, password, mode: 'json' }),
	});

	return { response, body: (await response.json()) as any };
}

test('a directory user can sign in with their own credentials', async () => {
	const { response, body } = await login(USER.uid, USER.password);

	expect(response.status).toBe(200);
	expect(response.headers.get('content-type')).toMatch(/application\/json/);

	expect(body.data).toMatchObject({
		access_token: expect.any(String),
		expires: expect.any(Number),
		refresh_token: expect.any(String),
	});
});

const REFUSED = [
	{ description: 'the password is wrong', identifier: USER.uid, password: 'not-the-password' },
	{ description: 'the user is not in the directory', identifier: 'nosuchuser', password: USER.password },
];

for (const { description, identifier, password } of REFUSED) {
	test(`signing in is refused when ${description}`, async () => {
		const { response, body } = await login(identifier, password);

		expect(response.status).toBe(401);
		expect(body.errors[0].extensions.code).toBe('INVALID_CREDENTIALS');
	});
}

test('signing in provisions a Directus user from the directory entry', async () => {
	await login(USER.uid, USER.password);

	// Read back as an admin: the provisioned user has no role, so it may not read its own fields
	const query = new URLSearchParams({
		filter: JSON.stringify({ email: { _eq: USER.email } }),
		fields: 'email,first_name,last_name,provider,external_identifier',
	});

	const response = await fetch(`${url}/users?${query}`, { headers: { Authorization: 'Bearer admin' } });

	expect(response.status).toBe(200);

	expect((await response.json()).data).toEqual([
		{
			email: USER.email,
			first_name: USER.firstName,
			last_name: USER.lastName,
			provider: 'ldap',
			external_identifier: expect.stringContaining(USER.uid),
		},
	]);
});
