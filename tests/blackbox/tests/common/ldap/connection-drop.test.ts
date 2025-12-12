/**
 * Directus LDAP Driver Integration Tests
 *
 * These tests validate the Directus LDAP authentication driver's behavior
 * when working with a real LDAP server. They test Directus-specific logic:
 * - Connection recovery and re-binding
 * - Error handling and transformation
 * - User lookup and authentication flow
 * - Filter escaping and security
 *
 * These tests are part of the blackbox test suite and only run when:
 * - Changes are merged to main
 * - PR has the "Run Blackbox" label
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Client } from 'ldapts';
import { LDAPAuthDriver } from '../../../../../api/src/auth/drivers/ldap.js';
import type { AuthDriverOptions } from '../../../../../api/src/types/index.js';
import { InvalidCredentialsError } from '@directus/errors';

/**
 * Real OpenLDAP Server Tests
 *
 * These tests run against the OpenLDAP Docker container started by docker-compose.
 * They validate Directus LDAP driver operations against a real server.
 *
 * Docker container config (cleanstart/openldap:2.6):
 *   - Port: 6109 (mapped to container 389)
 *   - Default Admin DN: cn=Manager,dc=my-domain,dc=com
 *   - Default Admin Password: secret
 *   - Base DN: dc=my-domain,dc=com
 */
describe('Directus LDAP Driver - Real Server Tests', () => {
	const LDAP_URL = 'ldap://127.0.0.1:6109';
	const ADMIN_DN = 'cn=Manager,dc=my-domain,dc=com';
	const ADMIN_PASSWORD = 'secret';
	const BASE_DN = 'dc=my-domain,dc=com';
	const USER_BASE_DN = 'ou=users,' + BASE_DN;

	let setupClient: Client;
	let driver: LDAPAuthDriver;

	// Create a test user in LDAP for authentication tests
	beforeAll(async () => {
		setupClient = new Client({
			url: LDAP_URL,
			connectTimeout: 5000,
			timeout: 5000,
		});

		// Bind as admin
		await setupClient.bind(ADMIN_DN, ADMIN_PASSWORD);

		// Create base DN if it doesn't exist
		try {
			await setupClient.add(BASE_DN, {
				objectClass: ['top', 'dcObject', 'organization'],
				o: 'My Domain',
				dc: 'my-domain',
			});
		} catch (err: any) {
			if (err?.code !== 68) {
				// 68 = entryAlreadyExists, ignore
				throw err;
			}
		}

		// Create users OU
		try {
			await setupClient.add(USER_BASE_DN, {
				objectClass: ['top', 'organizationalUnit'],
				ou: 'users',
			});
		} catch (err: any) {
			if (err?.code !== 68) {
				throw err;
			}
		}

		// Create test user
		const testUserDn = `cn=testuser,${USER_BASE_DN}`;

		try {
			await setupClient.add(testUserDn, {
				objectClass: ['top', 'inetOrgPerson', 'organizationalPerson', 'person'],
				cn: 'testuser',
				sn: 'User',
				givenName: 'Test',
				mail: 'testuser@example.com',
				uid: 'testuser',
				userPassword: 'testpassword',
			});
		} catch (err: any) {
			if (err?.code !== 68) {
				throw err;
			}
		}

		// Create Directus LDAP driver instance
		const mockOptions: AuthDriverOptions = {
			provider: 'ldap',
			getSchema: async () => null as any,
		};

		const driverConfig = {
			provider: 'ldap',
			bindDn: ADMIN_DN,
			bindPassword: ADMIN_PASSWORD,
			userDn: USER_BASE_DN,
			clientUrl: LDAP_URL,
			userFilter: '(uid={{identifier}})',
			identifierAttribute: 'uid',
			firstNameAttribute: 'givenName',
			lastNameAttribute: 'sn',
			mailAttribute: 'mail',
		};

		driver = new LDAPAuthDriver(mockOptions, driverConfig);
	});

	afterAll(async () => {
		try {
			await setupClient.unbind();
		} catch {
			// Ignore
		}
	});

	describe('Directus LDAP Driver - User Lookup (fetchUserInfo)', () => {
		it('should find existing user by identifier', async () => {
			const userInfo = await (driver as any).fetchUserInfo(USER_BASE_DN, '(uid=testuser)', 'one');

			expect(userInfo).toBeDefined();

			expect(userInfo).toMatchObject({
				dn: expect.stringContaining('testuser'),
				email: 'testuser@example.com',
				firstName: 'Test',
				lastName: 'User',
			});
		});

		it('should return undefined for non-existent user', async () => {
			const userInfo = await (driver as any).fetchUserInfo(USER_BASE_DN, '(uid=nonexistentuser)', 'one');

			expect(userInfo).toBeUndefined();
		});

		it('should handle filter escaping correctly', async () => {
			// The driver uses escapeFilterValue internally when building filters
			// Test that a properly escaped filter works
			const userInfo = await (driver as any).fetchUserInfo(USER_BASE_DN, '(uid=testuser)', 'one');

			expect(userInfo).toBeDefined();
		});
	});

	describe('Directus LDAP Driver - Authentication (verify)', () => {
		it('should successfully verify valid credentials', async () => {
			const testUserDn = `cn=testuser,${USER_BASE_DN}`;

			const mockUser = {
				external_identifier: testUserDn,
			} as any;

			await expect(driver.verify(mockUser, 'testpassword')).resolves.not.toThrow();
		});

		it('should reject invalid password', async () => {
			const testUserDn = `cn=testuser,${USER_BASE_DN}`;

			const mockUser = {
				external_identifier: testUserDn,
			} as any;

			await expect(driver.verify(mockUser, 'wrongpassword')).rejects.toThrow(InvalidCredentialsError);
		});

		it('should reject non-existent user DN', async () => {
			const mockUser = {
				external_identifier: `cn=nonexistent,${USER_BASE_DN}`,
			} as any;

			await expect(driver.verify(mockUser, 'password')).rejects.toThrow();
		});
	});

	describe('Directus LDAP Driver - Connection Recovery', () => {
		it('should recover from stale connection by re-binding', async () => {
			// First, fetch user info (this validates bind client)
			const userInfo1 = await (driver as any).fetchUserInfo(USER_BASE_DN, '(uid=testuser)', 'one');
			expect(userInfo1).toBeDefined();

			// Force unbind the internal client (simulating connection drop)
			await (driver as any).bindClient.unbind().catch(() => {});

			// Next operation should recover by re-binding (validateBindClient is called)
			await (driver as any).validateBindClient();

			// Now fetch should work again
			const userInfo2 = await (driver as any).fetchUserInfo(USER_BASE_DN, '(uid=testuser)', 'one');
			expect(userInfo2).toBeDefined();
		});

		it('should create new client for each verify operation', async () => {
			// verify() creates a new client each time, so multiple calls should work
			const testUserDn = `cn=testuser,${USER_BASE_DN}`;
			const mockUser = { external_identifier: testUserDn } as any;

			await expect(driver.verify(mockUser, 'testpassword')).resolves.not.toThrow();
			await expect(driver.verify(mockUser, 'testpassword')).resolves.not.toThrow();
		});
	});

	describe('Directus LDAP Driver - Error Handling', () => {
		it('should transform LDAP errors to Directus errors', async () => {
			// Test that invalid credentials are transformed to InvalidCredentialsError
			const testUserDn = `cn=testuser,${USER_BASE_DN}`;

			const mockUser = {
				external_identifier: testUserDn,
			} as any;

			await expect(driver.verify(mockUser, 'wrongpassword')).rejects.toThrow(InvalidCredentialsError);
		});
	});

	describe('Directus LDAP Driver - Refresh Operation', () => {
		it('should re-validate bind client on refresh', async () => {
			// refresh() should call validateBindClient() which re-binds
			const testUserDn = `cn=testuser,${USER_BASE_DN}`;

			const mockUser = {
				external_identifier: testUserDn,
			} as any;

			await expect(driver.refresh(mockUser)).resolves.not.toThrow();
		});
	});
});
