import config, { Env, getUrl } from '@common/config';
import vendors from '@common/get-dbs-to-test';
import request from 'supertest';
import knex, { Knex } from 'knex';
import { spawn, ChildProcess } from 'child_process';
import { awaitDirectusConnection } from '@utils/await-connection';
import * as common from '@common/index';
import { cloneDeep } from 'lodash';
import { EnumType } from 'json-to-graphql-query';
import { sleep } from '@utils/sleep';

describe('Logger Redact Tests', () => {
	const databases = new Map<string, Knex>();
	const tzDirectus = {} as { [vendor: string]: ChildProcess };
	const envs = {} as { [vendor: string]: Env };
	const logs = {} as { [vendor: string]: string };
	const authModes = ['json', 'cookie'];

	beforeAll(async () => {
		const promises = [];

		for (const vendor of vendors) {
			databases.set(vendor, knex(config.knexConfig[vendor]!));

			const env = cloneDeep(config.envs);
			env[vendor].LOG_STYLE = 'raw';

			const newServerPort = Number(env[vendor]!.PORT) + 500;
			env[vendor]!.PORT = String(newServerPort);

			const server = spawn('node', ['api/cli', 'start'], { env: env[vendor] });
			tzDirectus[vendor] = server;
			envs[vendor] = env;
			logs[vendor] = '';

			server.stdout.on('data', (data) => {
				logs[vendor] += String(data);
			});

			promises.push(awaitDirectusConnection(newServerPort));
		}

		// Give the server some time to start
		await Promise.all(promises);
	}, 180000);

	afterAll(async () => {
		for (const [vendor, connection] of databases) {
			tzDirectus[vendor]!.kill();

			await connection.destroy();
		}
	});

	describe('POST /refresh', () => {
		const logSyncDelay = 100;

		async function waitForLogs() {
			await sleep(logSyncDelay);
		}

		async function clearLogs(vendor: string) {
			await sleep(logSyncDelay);
			logs[vendor] = '';
		}

		describe('refreshes with refresh_token in the body', () => {
			describe.each(authModes)('for %s mode', (mode) => {
				common.TEST_USERS.forEach((userKey) => {
					describe(common.USER[userKey].NAME, () => {
						it.each(vendors)('%s', async (vendor) => {
							// Setup
							const env = envs[vendor];

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
							await clearLogs(vendor);

							const response = await request(getUrl(vendor, env))
								.post(`/auth/refresh`)
								.send({ refresh_token: refreshToken, mode })
								.expect('Content-Type', /application\/json/);

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

							await waitForLogs();

							// Assert
							expect(response.statusCode).toBe(200);
							if (mode === 'cookie') {
								expect(response.body).toMatchObject({
									data: {
										access_token: expect.any(String),
										expires: expect.any(Number),
									},
								});
								expect((logs[vendor].match(/"cookie":"--redact--"/g) || []).length).toBe(0);
								expect((logs[vendor].match(/"set-cookie":"--redact--"/g) || []).length).toBe(2);
							} else {
								expect(response.body).toMatchObject({
									data: {
										access_token: expect.any(String),
										expires: expect.any(Number),
										refresh_token: expect.any(String),
									},
								});
								expect((logs[vendor].match(/"cookie":"--redact--"/g) || []).length).toBe(0);
								expect((logs[vendor].match(/"set-cookie":"--redact--"/g) || []).length).toBe(0);
							}

							expect(gqlResponse.statusCode).toBe(200);
							expect(gqlResponse.body).toMatchObject({
								data: {
									[mutationKey]: {
										access_token: expect.any(String),
										expires: expect.any(Number),
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
							const env = envs[vendor];
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
							await clearLogs(vendor);

							const response = await request(getUrl(vendor, env))
								.post(`/auth/refresh`)
								.set('Cookie', `${cookieName}=${refreshToken}`)
								.send({ mode })
								.expect('Content-Type', /application\/json/);

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

							await waitForLogs();

							// Assert
							expect(response.statusCode).toBe(200);
							if (mode === 'cookie') {
								expect(response.body).toMatchObject({
									data: {
										access_token: expect.any(String),
										expires: expect.any(Number),
									},
								});
								expect((logs[vendor].match(/"cookie":"--redact--"/g) || []).length).toBe(2);
								expect((logs[vendor].match(/"set-cookie":"--redact--"/g) || []).length).toBe(2);
							} else {
								expect(response.body).toMatchObject({
									data: {
										access_token: expect.any(String),
										expires: expect.any(Number),
										refresh_token: expect.any(String),
									},
								});
								expect((logs[vendor].match(/"cookie":"--redact--"/g) || []).length).toBe(2);
								expect((logs[vendor].match(/"set-cookie":"--redact--"/g) || []).length).toBe(0);
							}

							expect(gqlResponse.statusCode).toBe(200);
							expect(gqlResponse.body).toMatchObject({
								data: {
									[mutationKey]: {
										access_token: expect.any(String),
										expires: expect.any(Number),
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
