import { getUrl } from '@common/config';
import vendors from '@common/get-dbs-to-test';
import { requestGraphQL } from '@common/transport';
import { TEST_USERS, USER } from '@common/variables';
import { EnumType } from 'json-to-graphql-query';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

describe('Authentication Refresh Tests', () => {
	describe('POST /refresh', () => {
		describe('json mode', () => {
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

						const gqlRefreshToken = (
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
							.send({ refresh_token: refreshToken })
							.expect('Content-Type', /application\/json/);

						const mutationKey = 'auth_refresh';

						const gqlResponse = await requestGraphQL(getUrl(vendor), true, null, {
							mutation: {
								[mutationKey]: {
									__args: {
										refresh_token: gqlRefreshToken,
									},
									access_token: true,
									expires: true,
									refresh_token: true,
								},
							},
						});

						// Assert
						expect(response.statusCode).toBe(200);

						expect(response.body).toMatchObject({
							data: {
								access_token: expect.any(String),
								expires: expect.any(Number),
								refresh_token: expect.any(String),
							},
						});

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

		const cookieModes = ['cookie', 'session'];

		describe.each(cookieModes)('%s mode', (mode) => {
			TEST_USERS.forEach((userKey) => {
				describe(USER[userKey].NAME, () => {
					it.each(vendors)('%s', async (vendor) => {
						// Setup
						const loginResponse = await request(getUrl(vendor))
							.post(`/auth/login`)
							.send({ email: USER[userKey].EMAIL, password: USER[userKey].PASSWORD, mode })
							.expect('Content-Type', /application\/json/);

						const cookie = loginResponse.get('Set-Cookie')!;

						const gqlLoginResponse = await requestGraphQL(getUrl(vendor), true, null, {
							mutation: {
								auth_login: {
									__args: {
										email: USER[userKey].EMAIL,
										password: USER[userKey].PASSWORD,
										mode: new EnumType(mode),
									},
									refresh_token: true,
								},
							},
						});

						const gqlCookie = gqlLoginResponse.get('Set-Cookie')![0]!;

						// Action
						const response = await request(getUrl(vendor))
							.post(`/auth/refresh`)
							.set('Cookie', cookie)
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
											mode: new EnumType(mode),
										},
										access_token: true,
										expires: true,
									},
								},
							},
							{ cookies: [gqlCookie] },
						);

						// Assert
						expect(response.statusCode).toBe(200);

						expect(response.body).toMatchObject({
							data: {
								...(mode === 'cookie' && { access_token: expect.any(String) }),
								expires: expect.any(Number),
							},
						});

						expect(gqlResponse.statusCode).toBe(200);

						expect(gqlResponse.body).toMatchObject({
							data: {
								[mutationKey]: {
									...(mode === 'cookie' && { access_token: expect.any(String) }),
									expires: expect.any(String),
								},
							},
						});
					});
				});
			});
		});
	});
});
