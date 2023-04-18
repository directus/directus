import config, { getUrl, paths } from '@common/config';
import vendors from '@common/get-dbs-to-test';
import * as common from '@common/index';
import request from 'supertest';
import { awaitDirectusConnection } from '@utils/await-connection';
import { sleep } from '@utils/sleep';
import { ChildProcess, spawn } from 'child_process';
import knex, { Knex } from 'knex';
import { cloneDeep } from 'lodash';

describe('WebSocket Auth Tests', () => {
	const authMethods: common.WebSocketAuthMethod[] = ['public', 'handshake', 'strict'];
	const authenticationTimeoutSeconds = 1;
	const slightDelay = 100;
	const pathREST = 'wsRest';

	describe.each(authMethods)('Authentication type: %s', (authMethod) => {
		const databases = new Map<string, Knex>();
		const directusInstances = {} as { [vendor: string]: ChildProcess };
		const env = cloneDeep(config.envs);

		for (const vendor of vendors) {
			env[vendor].WEBSOCKETS_REST_AUTH = authMethod;
			env[vendor].WEBSOCKETS_REST_AUTH_TIMEOUT = String(authenticationTimeoutSeconds);
			env[vendor].WEBSOCKETS_REST_PATH = `/${pathREST}`;
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

		describe('connects without authentication', () => {
			common.TEST_USERS.forEach((userKey) => {
				describe(common.USER[userKey].NAME, () => {
					it.each(vendors)('%s', async (vendor) => {
						// Action
						const ws = common.createWebSocketConn(getUrl(vendor, env), {
							path: pathREST,
						});

						let error;

						try {
							switch (authMethod) {
								case 'public':
									await ws.waitForState(ws.conn.OPEN);
									await sleep(authenticationTimeoutSeconds * 1000 + slightDelay);
									await ws.waitForState(ws.conn.OPEN);
									break;
								case 'handshake':
									await ws.waitForState(ws.conn.OPEN);
									await sleep(authenticationTimeoutSeconds * 1000 + slightDelay);
									await ws.waitForState(ws.conn.CLOSED);
									break;
								case 'strict':
									await ws.waitForState(ws.conn.CLOSED);
									await sleep(authenticationTimeoutSeconds * 1000);
									await ws.waitForState(ws.conn.CLOSED);
									break;
							}
						} catch (err) {
							error = err;
						}

						ws.conn.close();

						// Assert
						expect(error).toBeUndefined();
					});
				});
			});
		});

		describe('connects with email authentication', () => {
			common.TEST_USERS.forEach((userKey) => {
				describe(common.USER[userKey].NAME, () => {
					it.each(vendors)('%s', async (vendor) => {
						// Action
						const ws = common.createWebSocketConn(getUrl(vendor, env), {
							path: pathREST,
							auth: { email: common.USER[userKey].EMAIL, password: common.USER[userKey].PASSWORD },
						});

						let error;

						try {
							switch (authMethod) {
								case 'public':
									await ws.waitForState(ws.conn.OPEN);
									await sleep(authenticationTimeoutSeconds * 1000 + slightDelay);
									await ws.waitForState(ws.conn.OPEN);
									break;
								case 'handshake':
									await ws.waitForState(ws.conn.OPEN);
									await sleep(authenticationTimeoutSeconds * 1000 + slightDelay);
									await ws.waitForState(ws.conn.OPEN);
									break;
								case 'strict':
									await ws.waitForState(ws.conn.CLOSED);
									await sleep(authenticationTimeoutSeconds * 1000);
									await ws.waitForState(ws.conn.CLOSED);
									break;
							}
						} catch (err) {
							error = err;
						}

						ws.conn.close();

						// Assert
						expect(error).toBeUndefined();
					});
				});
			});
		});

		describe('connects with access token authentication', () => {
			common.TEST_USERS.forEach((userKey) => {
				describe(common.USER[userKey].NAME, () => {
					it.each(vendors)('%s', async (vendor) => {
						// Setup
						const { access_token } = (
							await request(getUrl(vendor))
								.post('/auth/login')
								.send({ email: common.USER[userKey].EMAIL, password: common.USER[userKey].PASSWORD })
						).body.data;

						// Action
						const ws = common.createWebSocketConn(getUrl(vendor, env), {
							path: pathREST,
							auth: { access_token },
						});

						let error;

						try {
							switch (authMethod) {
								case 'public':
									await ws.waitForState(ws.conn.OPEN);
									await sleep(authenticationTimeoutSeconds * 1000 + slightDelay);
									await ws.waitForState(ws.conn.OPEN);
									break;
								case 'handshake':
									await ws.waitForState(ws.conn.OPEN);
									await sleep(authenticationTimeoutSeconds * 1000 + slightDelay);
									await ws.waitForState(ws.conn.OPEN);
									break;
								case 'strict':
									await ws.waitForState(ws.conn.CLOSED);
									await sleep(authenticationTimeoutSeconds * 1000);
									await ws.waitForState(ws.conn.CLOSED);
									break;
							}
						} catch (err) {
							error = err;
						}

						ws.conn.close();

						// Assert
						expect(error).toBeUndefined();
					});
				});
			});
		});

		describe('connects with static access token authentication', () => {
			common.TEST_USERS.forEach((userKey) => {
				describe(common.USER[userKey].NAME, () => {
					it.each(vendors)('%s', async (vendor) => {
						// Action
						const ws = common.createWebSocketConn(getUrl(vendor, env), {
							path: pathREST,
							auth: { access_token: common.USER[userKey].TOKEN },
						});

						let error;

						try {
							switch (authMethod) {
								case 'public':
									await ws.waitForState(ws.conn.OPEN);
									await sleep(authenticationTimeoutSeconds * 1000 + slightDelay);
									await ws.waitForState(ws.conn.OPEN);
									break;
								case 'handshake':
									await ws.waitForState(ws.conn.OPEN);
									await sleep(authenticationTimeoutSeconds * 1000 + slightDelay);
									await ws.waitForState(ws.conn.OPEN);
									break;
								case 'strict':
									await ws.waitForState(ws.conn.CLOSED);
									await sleep(authenticationTimeoutSeconds * 1000);
									await ws.waitForState(ws.conn.CLOSED);
									break;
							}
						} catch (err) {
							error = err;
						}

						ws.conn.close();

						// Assert
						expect(error).toBeUndefined();
					});
				});
			});
		});

		describe('connects with access token in query string', () => {
			common.TEST_USERS.forEach((userKey) => {
				describe(common.USER[userKey].NAME, () => {
					it.each(vendors)('%s', async (vendor) => {
						// Setup
						const { access_token } = (
							await request(getUrl(vendor))
								.post('/auth/login')
								.send({ email: common.USER[userKey].EMAIL, password: common.USER[userKey].PASSWORD })
						).body.data;

						// Action
						const ws = common.createWebSocketConn(getUrl(vendor, env), {
							path: pathREST,
							queryString: `access_token=${access_token}`,
						});

						let error;

						try {
							switch (authMethod) {
								case 'public':
									await ws.waitForState(ws.conn.OPEN);
									await sleep(authenticationTimeoutSeconds * 1000 + slightDelay);
									await ws.waitForState(ws.conn.OPEN);
									break;
								case 'handshake':
									await ws.waitForState(ws.conn.OPEN);
									await sleep(authenticationTimeoutSeconds * 1000 + slightDelay);
									await ws.waitForState(ws.conn.CLOSED);
									break;
								case 'strict':
									await ws.waitForState(ws.conn.OPEN);
									await sleep(authenticationTimeoutSeconds * 1000 + slightDelay);
									await ws.waitForState(ws.conn.OPEN);
									break;
							}
						} catch (err) {
							error = err;
						}

						ws.conn.close();

						// Assert
						expect(error).toBeUndefined();
					});
				});
			});
		});

		describe('connects with static access token in query string', () => {
			common.TEST_USERS.forEach((userKey) => {
				describe(common.USER[userKey].NAME, () => {
					it.each(vendors)('%s', async (vendor) => {
						// Action
						const ws = common.createWebSocketConn(getUrl(vendor, env), {
							path: pathREST,
							queryString: `access_token=${common.USER[userKey].TOKEN}`,
						});

						let error;

						try {
							switch (authMethod) {
								case 'public':
									await ws.waitForState(ws.conn.OPEN);
									await sleep(authenticationTimeoutSeconds * 1000 + slightDelay);
									await ws.waitForState(ws.conn.OPEN);
									break;
								case 'handshake':
									await ws.waitForState(ws.conn.OPEN);
									await sleep(authenticationTimeoutSeconds * 1000 + slightDelay);
									await ws.waitForState(ws.conn.CLOSED);
									break;
								case 'strict':
									await ws.waitForState(ws.conn.OPEN);
									await sleep(authenticationTimeoutSeconds * 1000 + slightDelay);
									await ws.waitForState(ws.conn.OPEN);
									break;
							}
						} catch (err) {
							error = err;
						}

						ws.conn.close();

						// Assert
						expect(error).toBeUndefined();
					});
				});
			});
		});

		describe('pings without authentication', () => {
			common.TEST_USERS.forEach((userKey) => {
				describe(common.USER[userKey].NAME, () => {
					it.each(vendors)('%s', async (vendor) => {
						// Action
						const ws = common.createWebSocketConn(getUrl(vendor, env), {
							path: pathREST,
							respondToPing: false,
						});

						let wsMessages: common.WebSocketResponse[] | undefined;
						let error;

						try {
							await ws.sendMessage({ type: 'ping' });
							wsMessages = await ws.getMessages(1);
						} catch (err) {
							error = err;
						}

						ws.conn.close();

						// Assert
						switch (authMethod) {
							case 'public':
								expect(wsMessages?.length).toBe(1);

								expect(wsMessages![0]).toEqual(
									expect.objectContaining({
										type: 'pong',
									})
								);

								break;
							case 'handshake':
							case 'strict':
								expect(error).toBeDefined();
								break;
						}
					});
				});
			});
		});

		describe('pings with access token authentication', () => {
			common.TEST_USERS.forEach((userKey) => {
				describe(common.USER[userKey].NAME, () => {
					it.each(vendors)('%s', async (vendor) => {
						// Action
						const ws = common.createWebSocketConn(getUrl(vendor, env), {
							path: pathREST,
							auth: { access_token: common.USER[userKey].TOKEN },
							respondToPing: false,
						});

						let wsMessages: common.WebSocketResponse[] | undefined;
						let error;

						try {
							await ws.sendMessage({ type: 'ping' });
							wsMessages = await ws.getMessages(1);
						} catch (err) {
							error = err;
						}

						ws.conn.close();

						// Assert
						switch (authMethod) {
							case 'public':
							case 'handshake':
								expect(wsMessages?.length).toBe(1);

								expect(wsMessages![0]).toEqual(
									expect.objectContaining({
										type: 'pong',
									})
								);

								break;
							case 'strict':
								expect(error).toBeDefined();
								break;
						}
					});
				});
			});
		});

		describe('pings with access token in query string', () => {
			common.TEST_USERS.forEach((userKey) => {
				describe(common.USER[userKey].NAME, () => {
					it.each(vendors)('%s', async (vendor) => {
						// Action
						const ws = common.createWebSocketConn(getUrl(vendor, env), {
							path: pathREST,
							queryString: `access_token=${common.USER[userKey].TOKEN}`,
							respondToPing: false,
						});

						let wsMessages: common.WebSocketResponse[] | undefined;
						let error;

						try {
							await ws.sendMessage({ type: 'ping' });
							wsMessages = await ws.getMessages(1);
						} catch (err) {
							error = err;
						}

						ws.conn.close();

						// Assert
						switch (authMethod) {
							case 'public':
							case 'strict':
								expect(wsMessages?.length).toBe(1);

								expect(wsMessages![0]).toEqual(
									expect.objectContaining({
										type: 'pong',
									})
								);

								break;
							case 'handshake':
								expect(error).toBeDefined();
								break;
						}
					});
				});
			});
		});
	});
});
