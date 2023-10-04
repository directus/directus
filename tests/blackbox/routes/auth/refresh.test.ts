import { getUrl } from '@common/config';
import vendors from '@common/get-dbs-to-test';
import { requestGraphQL } from '@common/transport';
import { TEST_USERS, USER } from '@common/variables';
import { EnumType } from 'json-to-graphql-query';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

const authModes = ['json', 'cookie'];

describe('Authentication Refresh Tests', () => {
	describe('POST /refresh', () => {
		describe('refreshes with refresh_token in the body', () => {
			describe.each(authModes)('for %s mode', (mode) => {
				TEST_USERS.forEach((userKey) => {
					describe(USER[userKey].NAME, () => {
						it.each(vendors)('%s', async (vendor) => {
							// Setup
							const refreshToken = (
								await request(getUrl(vendor))
									.post(`/auth/login`)
									.send({ email: USER[userKey].EMAIL, password: USER[userKey].PASSWORD })
									.expect('Content-Type', /application\/json/)
							).body.data.refresh_token;

							const refreshToken2 = (
								await requestGraphQL(getUrl(vendor), true, null, {
									mutation: {
										auth_login: {
											__args: {
												email: USER[userKey].EMAIL,
												password: USER[userKey].PASSWORD,
											},
											refresh_token: true,
										},
									},
								})
							).body.data.auth_login.refresh_token;

							// Action
							const response = await request(getUrl(vendor))
								.post(`/auth/refresh`)
								.send({ refresh_token: refreshToken, mode })
								.expect('Content-Type', /application\/json/);

							const mutationKey = 'auth_refresh';

							const gqlResponse = await requestGraphQL(getUrl(vendor), true, null, {
								mutation: {
									[mutationKey]: {
										__args: {
											refresh_token: refreshToken2,
											mode: new EnumType(mode),
										},
										access_token: true,
										expires: true,
										refresh_token: true,
									},
								},
							});

							// Assert
							expect(response.statusCode).toBe(200);

							if (mode === 'cookie') {
								expect(response.body).toMatchObject({
									data: {
										access_token: expect.any(String),
										expires: expect.any(Number),
									},
								});
							} else {
								expect(response.body).toMatchObject({
									data: {
										access_token: expect.any(String),
										expires: expect.any(Number),
										refresh_token: expect.any(String),
									},
								});
							}

							expect(gqlResponse.statusCode).toBe(200);

							expect(gqlResponse.body).toMatchObject({
								data: {
									[mutationKey]: {
										access_token: expect.any(String),
										expires: expect.any(String),
										refresh_token: expect.any(String),
									},
								},
							});
						});
					});
				});
			});
		});

		describe('refreshes with refresh_token in the cookie', () => {
			describe.each(authModes)('for %s mode', (mode) => {
				TEST_USERS.forEach((userKey) => {
					describe(USER[userKey].NAME, () => {
						it.each(vendors)('%s', async (vendor) => {
							// Setup
							const cookieName = 'directus_refresh_token';

							const refreshToken = (
								await request(getUrl(vendor))
									.post(`/auth/login`)
									.send({ email: USER[userKey].EMAIL, password: USER[userKey].PASSWORD })
									.expect('Content-Type', /application\/json/)
							).body.data.refresh_token;

							const refreshToken2 = (
								await requestGraphQL(getUrl(vendor), true, null, {
									mutation: {
										auth_login: {
											__args: {
												email: USER[userKey].EMAIL,
												password: USER[userKey].PASSWORD,
											},
											refresh_token: true,
										},
									},
								})
							).body.data.auth_login.refresh_token;

							// Action
							const response = await request(getUrl(vendor))
								.post(`/auth/refresh`)
								.set('Cookie', `${cookieName}=${refreshToken}`)
								.send({ mode })
								.expect('Content-Type', /application\/json/);

							const mutationKey = 'auth_refresh';

							const gqlResponse = await requestGraphQL(
								getUrl(vendor),
								true,
								null,
								{
									mutation: {
										[mutationKey]: {
											__args: {
												refresh_token: refreshToken2,
												mode: new EnumType(mode),
											},
											access_token: true,
											expires: true,
											refresh_token: true,
										},
									},
								},
								{ cookies: [`${cookieName}=${refreshToken2}`] }
							);

							// Assert
							expect(response.statusCode).toBe(200);

							if (mode === 'cookie') {
								expect(response.body).toMatchObject({
									data: {
										access_token: expect.any(String),
										expires: expect.any(Number),
									},
								});
							} else {
								expect(response.body).toMatchObject({
									data: {
										access_token: expect.any(String),
										expires: expect.any(Number),
										refresh_token: expect.any(String),
									},
								});
							}

							expect(gqlResponse.statusCode).toBe(200);

							expect(gqlResponse.body).toMatchObject({
								data: {
									[mutationKey]: {
										access_token: expect.any(String),
										expires: expect.any(String),
										refresh_token: expect.any(String),
									},
								},
							});
						});
					});
				});
			});
		});
	});
});
