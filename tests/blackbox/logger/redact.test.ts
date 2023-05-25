import config, { getUrl, paths } from '@common/config';
import vendors from '@common/get-dbs-to-test';
import * as common from '@common/index';
import { TestLogger } from '@common/test-logger';
import { awaitDirectusConnection } from '@utils/await-connection';
import { ChildProcess, spawn } from 'child_process';
import { EnumType } from 'json-to-graphql-query';
import type { Knex } from 'knex';
import knex from 'knex';
import { cloneDeep } from 'lodash';
import request from 'supertest';

describe('Logger Redact Tests', () => {
	const databases = new Map<string, Knex>();
	const directusInstances = {} as { [vendor: string]: ChildProcess };
	const env = cloneDeep(config.envs);
	const authModes = ['json', 'cookie'];

	for (const vendor of vendors) {
		env[vendor].LOG_STYLE = 'raw';
		env[vendor].LOG_LEVEL = 'info';
		env[vendor].PORT = String(Number(env[vendor]!.PORT) + 500);
	}

	beforeAll(async () => {
		const promises = [];

		for (const vendor of vendors) {
			databases.set(vendor, knex(config.knexConfig[vendor]!));

			const server = spawn('node', [paths.cli, 'start'], { cwd: paths.cwd, env: env[vendor] });
			directusInstances[vendor] = server;

			promises.push(awaitDirectusConnection(Number(env[vendor].PORT)));
		}

		// Give the server some time to start
		await Promise.all(promises);
	}, 180000);

	afterAll(async () => {
		for (const [vendor, connection] of databases) {
			directusInstances[vendor]!.kill();

			await connection.destroy();
		}
	});

	describe('POST /refresh', () => {
		describe('refreshes with refresh_token in the body', () => {
			describe.each(authModes)('for %s mode', (mode) => {
				common.TEST_USERS.forEach((userKey) => {
					describe(common.USER[userKey].NAME, () => {
						it.each(vendors)('%s', async (vendor) => {
							// Setup
							const refreshToken = (
								await request(getUrl(vendor, env))
									.post(`/auth/login`)
									.send({ email: common.USER[userKey].EMAIL, password: common.USER[userKey].PASSWORD })
									.expect('Content-Type', /application\/json/)
							).body.data.refresh_token;

							const refreshToken2 = (
								await common.requestGraphQL(getUrl(vendor, env), true, null, {
									mutation: {
										auth_login: {
											__args: {
												email: common.USER[userKey].EMAIL,
												password: common.USER[userKey].PASSWORD,
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
								.send({ refresh_token: refreshToken, mode })
								.expect('Content-Type', /application\/json/);

							const logs = await logger.getLogs();

							const loggerGql = new TestLogger(directusInstances[vendor], '/graphql/system', true);

							const mutationKey = 'auth_refresh';

							const gqlResponse = await common.requestGraphQL(getUrl(vendor, env), true, null, {
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

							const logsGql = await loggerGql.getLogs();

							// Assert
							expect(response.statusCode).toBe(200);

							if (mode === 'cookie') {
								expect(response.body).toMatchObject({
									data: {
										access_token: expect.any(String),
										expires: expect.any(Number),
									},
								});

								for (const log of [logs, logsGql]) {
									expect((log.match(/"cookie":"--redacted--"/g) || []).length).toBe(0);
									expect((log.match(/"set-cookie":"--redacted--"/g) || []).length).toBe(1);
								}
							} else {
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
				common.TEST_USERS.forEach((userKey) => {
					describe(common.USER[userKey].NAME, () => {
						it.each(vendors)('%s', async (vendor) => {
							// Setup
							const cookieName = 'directus_refresh_token';

							const refreshToken = (
								await request(getUrl(vendor, env))
									.post(`/auth/login`)
									.send({ email: common.USER[userKey].EMAIL, password: common.USER[userKey].PASSWORD })
									.expect('Content-Type', /application\/json/)
							).body.data.refresh_token;

							const refreshToken2 = (
								await common.requestGraphQL(getUrl(vendor, env), true, null, {
									mutation: {
										auth_login: {
											__args: {
												email: common.USER[userKey].EMAIL,
												password: common.USER[userKey].PASSWORD,
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
								.set('Cookie', `${cookieName}=${refreshToken}`)
								.send({ mode })
								.expect('Content-Type', /application\/json/);

							const logs = await logger.getLogs();

							const loggerGql = new TestLogger(directusInstances[vendor], '/graphql/system', true);

							const mutationKey = 'auth_refresh';

							const gqlResponse = await common.requestGraphQL(
								getUrl(vendor, env),
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

							const logsGql = await loggerGql.getLogs();

							// Assert
							expect(response.statusCode).toBe(200);

							if (mode === 'cookie') {
								expect(response.body).toMatchObject({
									data: {
										access_token: expect.any(String),
										expires: expect.any(Number),
									},
								});

								for (const log of [logs, logsGql]) {
									expect((log.match(/"cookie":"--redacted--"/g) || []).length).toBe(1);
									expect((log.match(/"set-cookie":"--redacted--"/g) || []).length).toBe(1);
								}
							} else {
								expect(response.body).toMatchObject({
									data: {
										access_token: expect.any(String),
										expires: expect.any(Number),
										refresh_token: expect.any(String),
									},
								});

								for (const log of [logs, logsGql]) {
									expect((log.match(/"cookie":"--redacted--"/g) || []).length).toBe(1);
									expect((log.match(/"set-cookie":"--redacted--"/g) || []).length).toBe(0);
								}
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
