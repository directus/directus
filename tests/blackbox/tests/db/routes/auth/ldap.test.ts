/**
 * Directus LDAP Authentication Integration Tests
 *
 * These tests validate Directus's LDAP authentication integration through the API.
 * They test the full authentication flow including:
 * - Login with valid LDAP credentials
 * - Login rejection with invalid credentials
 * - User auto-provisioning from LDAP attributes
 *
 * These tests run against a real OpenLDAP server (docker-compose openldap service)
 * and test Directus's LDAP integration as a whole, not the ldapts library itself.
 */

import { getUrl } from '@common/config';
import vendors from '@common/get-dbs-to-test';
import { Client } from 'ldapts';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

// LDAP server configuration (matches docker-compose.yml openldap service)
const LDAP_URL = 'ldap://127.0.0.1:6109';
const ADMIN_DN = 'cn=Manager,dc=my-domain,dc=com';
const ADMIN_PASSWORD = 'secret';
const BASE_DN = 'dc=my-domain,dc=com';
const USER_BASE_DN = 'ou=users,' + BASE_DN;

// Test user credentials
const TEST_USER = {
	uid: 'ldaptestuser',
	password: 'ldaptestpassword',
	email: 'ldaptestuser@example.com',
	firstName: 'LDAP',
	lastName: 'TestUser',
};

let setupClient: Client;

describe('/auth/login/ldap', () => {
	beforeAll(async () => {
		// Set up LDAP test data
		setupClient = new Client({
			url: LDAP_URL,
			connectTimeout: 10000,
			timeout: 10000,
		});

		// Bind as admin
		await setupClient.bind(ADMIN_DN, ADMIN_PASSWORD);

		// Create base DN if it doesn't exist
		try {
			await setupClient.add(BASE_DN, {
				objectClass: ['top', 'domain', 'dcObject'],
				dc: 'my-domain',
			});
		} catch (err: any) {
			if (err?.code !== 68) {
				// 68 = entryAlreadyExists, ignore
				throw err;
			}
		}

		// Create Manager entry if it doesn't exist (needed for our healthcheck)
		try {
			await setupClient.add(ADMIN_DN, {
				objectClass: ['top', 'person', 'organizationalPerson'],
				cn: 'Manager',
				sn: 'Manager',
			});
		} catch (err: any) {
			if (err?.code !== 68) {
				// 68 = entryAlreadyExists, ignore
				throw err;
			}
		}

		// Create users OU if it doesn't exist
		try {
			await setupClient.add(USER_BASE_DN, {
				objectClass: ['top', 'organizationalUnit'],
				ou: 'users',
			});
		} catch (err: any) {
			if (err?.code !== 68) {
				// 68 = entryAlreadyExists, ignore
				throw err;
			}
		}

		// Create test user for authentication tests
		const testUserDn = `cn=${TEST_USER.uid},${USER_BASE_DN}`;

		try {
			await setupClient.add(testUserDn, {
				objectClass: ['top', 'inetOrgPerson', 'organizationalPerson', 'person'],
				cn: TEST_USER.uid,
				sn: TEST_USER.lastName,
				givenName: TEST_USER.firstName,
				mail: TEST_USER.email,
				uid: TEST_USER.uid,
				userPassword: TEST_USER.password,
			});
		} catch (err: any) {
			if (err?.code !== 68) {
				// 68 = entryAlreadyExists, ignore
				throw err;
			}
		}
	}, 30000);

	afterAll(async () => {
		try {
			await setupClient.unbind();
		} catch {
			// Ignore cleanup errors
		}
	});

	describe('POST /auth/login/ldap', () => {
		describe('when correct LDAP credentials are provided', () => {
			describe('returns an access_token, expires and a refresh_token', () => {
				it.each(vendors)('%s', async (vendor) => {
					const response = await request(getUrl(vendor))
						.post('/auth/login/ldap')
						.send({
							identifier: TEST_USER.uid,
							password: TEST_USER.password,
						})
						.expect('Content-Type', /application\/json/);

					expect(response.statusCode).toBe(200);

					expect(response.body).toMatchObject({
						data: {
							access_token: expect.any(String),
							expires: expect.any(Number),
							refresh_token: expect.any(String),
						},
					});
				});
			});
		});

		describe('when incorrect LDAP credentials are provided', () => {
			describe('returns INVALID_CREDENTIALS for wrong password', () => {
				it.each(vendors)('%s', async (vendor) => {
					const response = await request(getUrl(vendor))
						.post('/auth/login/ldap')
						.send({
							identifier: TEST_USER.uid,
							password: 'wrongpassword',
						})
						.expect('Content-Type', /application\/json/);

					expect(response.statusCode).toBe(401);

					expect(response.body).toMatchObject({
						errors: [
							{
								message: expect.stringContaining('Invalid'),
								extensions: {
									code: 'INVALID_CREDENTIALS',
								},
							},
						],
					});
				});
			});

			describe('returns INVALID_CREDENTIALS for non-existent user', () => {
				it.each(vendors)('%s', async (vendor) => {
					const response = await request(getUrl(vendor))
						.post('/auth/login/ldap')
						.send({
							identifier: 'nonexistentuser',
							password: 'somepassword',
						})
						.expect('Content-Type', /application\/json/);

					expect(response.statusCode).toBe(401);

					expect(response.body).toMatchObject({
						errors: [
							{
								message: expect.stringContaining('Invalid'),
								extensions: {
									code: 'INVALID_CREDENTIALS',
								},
							},
						],
					});
				});
			});
		});

		describe('when user logs in successfully', () => {
			describe('creates user with correct attributes from LDAP', () => {
				it.each(vendors)('%s', async (vendor) => {
					// First login to create/update the user
					const loginResponse = await request(getUrl(vendor))
						.post('/auth/login/ldap')
						.send({
							identifier: TEST_USER.uid,
							password: TEST_USER.password,
						})
						.expect(200);

					const accessToken = loginResponse.body.data.access_token;

					// Get current user info
					const meResponse = await request(getUrl(vendor))
						.get('/users/me')
						.set('Authorization', `Bearer ${accessToken}`)
						.expect(200);

					// Verify user attributes were synced from LDAP
					expect(meResponse.body.data).toMatchObject({
						email: TEST_USER.email,
						first_name: TEST_USER.firstName,
						last_name: TEST_USER.lastName,
						provider: 'ldap',
						external_identifier: expect.stringContaining(TEST_USER.uid),
					});
				});
			});
		});
	});
});
