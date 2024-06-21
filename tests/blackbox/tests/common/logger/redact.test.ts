import config, { getUrl, paths } from '@common/config';
import vendors, { type Vendor } from '@common/get-dbs-to-test';
import { TestLogger } from '@common/test-logger';
import { requestGraphQL } from '@common/transport';
import { TEST_USERS, USER } from '@common/variables';
import { awaitDirectusConnection } from '@utils/await-connection';
import { ChildProcess, spawn } from 'child_process';
import getPort from 'get-port';
import { EnumType } from 'json-to-graphql-query';
import type { Knex } from 'knex';
import knex from 'knex';
import { cloneDeep } from 'lodash-es';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('Logger Redact Tests', () => {
	const databases = new Map<Vendor, Knex>();
	const directusInstances = {} as Record<Vendor, ChildProcess>;
	const env = cloneDeep(config.envs);

	beforeAll(async () => {
		const promises = [];

		for (const vendor of vendors) {
			databases.set(vendor, knex(config.knexConfig[vendor]!));

			const newServerPort = await getPort();

			env[vendor]['LOG_STYLE'] = 'raw';
			env[vendor]['LOG_LEVEL'] = 'info';
			env[vendor].PORT = String(newServerPort);

			const server = spawn('node', [paths.cli, 'start'], { cwd: paths.cwd, env: env[vendor] });
			directusInstances[vendor] = server;

			promises.push(awaitDirectusConnection(newServerPort));
		}

		// Give the server some time to start
		await Promise.all(promises);
	}, 180_000);

	afterAll(async () => {
		for (const [vendor, connection] of databases) {
			directusInstances[vendor].kill();

			await connection.destroy();
		}
	});

	describe('POST /refresh', () => {
		describe('json mode', () => {
			TEST_USERS.forEach((userKey) => {
				describe(USER[userKey].NAME, () => {
					it.each(vendors)('%s', async (vendor) => {
						// Setup
						const refreshToken = (
							await request(getUrl(vendor, env))
								.post(`/auth/login`)
								.send({ email: USER[userKey].EMAIL, password: USER[userKey].PASSWORD })
								.expect('Content-Type', /application\/json/)
						).body.data.refresh_token;

						const gqlRefreshToken = (
							await requestGraphQL(getUrl(vendor, env), true, null, {
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
						const logger = new TestLogger(directusInstances[vendor], '/auth/refresh', true);

						const response = await request(getUrl(vendor, env))
							.post(`/auth/refresh`)
							.send({ refresh_token: refreshToken })
							.expect('Content-Type', /application\/json/);

						const logs = await logger.getLogs();

						const loggerGql = new TestLogger(directusInstances[vendor], '/graphql/system', true);

						const mutationKey = 'auth_refresh';

						const gqlResponse = await requestGraphQL(getUrl(vendor, env), true, null, {
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

						const logsGql = await loggerGql.getLogs();

						// Assert
						expect(response.statusCode).toBe(200);

						expect(response.body).toMatchObject({
							data: {
								access_token: expect.any(String),
								expires: expect.any(Number),
								refresh_token: expect.any(String),
							},
						});

						for (const log of [logs, logsGql]) {
							expect((log.match(/"cookie":"--redacted--"/g) || []).length).toBe(0);
							expect((log.match(/"set-cookie":"--redacted--"/g) || []).length).toBe(0);
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

		const cookieModes = ['cookie', 'session'];

		describe.each(cookieModes)('%s mode', (mode) => {
			TEST_USERS.forEach((userKey) => {
				describe(USER[userKey].NAME, () => {
					it.each(vendors)('%s', async (vendor) => {
						// Setup
						const loginResponse = await request(getUrl(vendor, env))
							.post(`/auth/login`)
							.send({ email: USER[userKey].EMAIL, password: USER[userKey].PASSWORD, mode })
							.expect('Content-Type', /application\/json/);

						const cookie = loginResponse.get('Set-Cookie')!;

						const gqlLoginResponse = await requestGraphQL(getUrl(vendor, env), true, null, {
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
						const logger = new TestLogger(directusInstances[vendor], '/auth/refresh', true);

						const response = await request(getUrl(vendor, env))
							.post(`/auth/refresh`)
							.set('Cookie', cookie)
							.send({ mode })
							.expect('Content-Type', /application\/json/);

						const logs = await logger.getLogs();

						const loggerGql = new TestLogger(directusInstances[vendor], '/graphql/system', true);

						const mutationKey = 'auth_refresh';

						const gqlResponse = await requestGraphQL(
							getUrl(vendor, env),
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

						const logsGql = await loggerGql.getLogs();

						// Assert
						expect(response.statusCode).toBe(200);

						expect(response.body).toMatchObject({
							data: {
								...(mode === 'cookie' && { access_token: expect.any(String) }),
								expires: expect.any(Number),
							},
						});

						for (const log of [logs, logsGql]) {
							expect((log.match(/"cookie":"--redacted--"/g) || []).length).toBe(1);
							expect((log.match(/"set-cookie":"--redacted--"/g) || []).length).toBe(1);
						}

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
