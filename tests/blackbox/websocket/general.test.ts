import config, { Env, getUrl, paths } from '@common/config';
import vendors from '@common/get-dbs-to-test';
import * as common from '@common/index';
import request from 'supertest';
import { awaitDirectusConnection } from '@utils/await-connection';
import { ChildProcess, spawn } from 'child_process';
import knex, { Knex } from 'knex';
import { cloneDeep } from 'lodash';
import { collectionFirst } from './general.seed';
import { v4 as uuid } from 'uuid';

describe('WebSocket General Tests', () => {
	const databases = new Map<string, Knex>();
	const directusInstances = {} as { [vendor: string]: ChildProcess[] };
	const envs = {} as { [vendor: string]: Env[] };

	beforeAll(async () => {
		const promises = [];

		for (const vendor of vendors) {
			databases.set(vendor, knex(config.knexConfig[vendor]!));

			const env1 = cloneDeep(config.envs);
			env1[vendor].MESSENGER_STORE = 'redis';
			env1[vendor].MESSENGER_NAMESPACE = `directus-ws-${vendor}`;
			env1[vendor].MESSENGER_REDIS = `redis://localhost:6108/4`;

			const env2 = cloneDeep(env1);

			const newServerPort1 = Number(env1[vendor]!.PORT) + 250;
			const newServerPort2 = Number(env2[vendor]!.PORT) + 300;

			env1[vendor]!.PORT = String(newServerPort1);
			env2[vendor]!.PORT = String(newServerPort2);

			const server1 = spawn('node', [paths.cli, 'start'], { cwd: paths.cwd, env: env1[vendor] });
			const server2 = spawn('node', [paths.cli, 'start'], { cwd: paths.cwd, env: env2[vendor] });

			directusInstances[vendor] = [server1, server2];
			envs[vendor] = [env1, env2];

			promises.push(awaitDirectusConnection(newServerPort1));
			promises.push(awaitDirectusConnection(newServerPort2));
		}

		// Give the server some time to start
		await Promise.all(promises);
	}, 180000);

	afterAll(async () => {
		for (const [vendor, connection] of databases) {
			for (const instance of directusInstances[vendor]!) {
				instance.kill();
			}

			await connection.destroy();
		}
	});

	describe.each(common.PRIMARY_KEY_TYPES)('Primary key type: %s', (pkType) => {
		const localCollectionFirst = `${collectionFirst}_${pkType}`;

		describe('Test subscriptions', () => {
			it.each(vendors)(
				'%s',
				async (vendor) => {
					// Setup
					const uids = [undefined, 1, 'two'];
					const env1 = envs[vendor][0];
					const env2 = envs[vendor][1];

					const ws = common.createWebSocketConn(getUrl(vendor, env1), {
						auth: { access_token: common.USER.ADMIN.TOKEN },
					});

					const ws2 = common.createWebSocketConn(getUrl(vendor, env2), {
						auth: { access_token: common.USER.ADMIN.TOKEN },
					});

					const wsGql = common.createWebSocketGql(getUrl(vendor, env1), {
						auth: { access_token: common.USER.ADMIN.TOKEN },
					});

					const wsGql2 = common.createWebSocketGql(getUrl(vendor, env2), {
						auth: { access_token: common.USER.ADMIN.TOKEN },
					});

					const messageList = [];
					const messageList2 = [];
					const messageListGql = [];
					const messageListGql2 = [];
					let subscriptionKey = '';

					// Action
					for (const uid of uids) {
						await ws.subscribe({ collection: localCollectionFirst, uid });
						await ws2.subscribe({ collection: localCollectionFirst, uid });

						subscriptionKey = await wsGql.subscribe({
							collection: localCollectionFirst,
							jsonQuery: {
								event: true,
								data: {
									id: true,
									name: true,
								},
							},
							uid,
						});

						await wsGql2.subscribe({
							collection: localCollectionFirst,
							jsonQuery: {
								event: true,
								data: {
									id: true,
									name: true,
								},
							},
							uid,
						});
					}

					const insertedName = uuid();

					const insertedId = (
						await request(getUrl(vendor, env1))
							.post(`/items/${localCollectionFirst}`)
							.send({ id: pkType === 'string' ? uuid() : undefined, name: insertedName })
							.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`)
					).body.data.id;

					for (const uid of uids) {
						messageList.push(await ws.getMessages(1, { uid }));
						messageList2.push(await ws2.getMessages(1, { uid }));
						messageListGql.push(await wsGql.getMessages(1, { uid }));
						messageListGql2.push(await wsGql2.getMessages(1, { uid }));
					}

					ws.conn.close();
					ws2.conn.close();
					await wsGql.client.dispose();
					await wsGql2.client.dispose();

					// Assert
					for (let i = 0; i < messageList.length; i++) {
						const wsMessages = messageList[i];
						expect(wsMessages?.length).toBe(1);

						expect(wsMessages![0]).toEqual({
							type: 'subscription',
							event: 'create',
							data: [{ id: insertedId, name: insertedName }],
							uid: uids[i] === undefined ? undefined : String(uids[i]),
						});
					}

					for (let i = 0; i < messageListGql.length; i++) {
						const wsMessages = messageListGql[i];
						expect(wsMessages?.length).toBe(1);

						expect(wsMessages![0]).toEqual({
							data: {
								[subscriptionKey]: {
									event: 'create',
									data: {
										id: String(insertedId),
										name: insertedName,
									},
								},
							},
						});
					}

					expect(messageList).toEqual(messageList2);
					expect(messageListGql).toEqual(messageListGql2);
				},
				100000
			);
		});

		describe('Test unsubscriptions', () => {
			it.each(vendors)(
				'%s',
				async (vendor) => {
					// Setup
					const uids = [undefined, 1, 'two'];
					const env1 = envs[vendor][0];
					const env2 = envs[vendor][1];

					const ws = common.createWebSocketConn(getUrl(vendor, env1), {
						auth: { access_token: common.USER.ADMIN.TOKEN },
					});

					const ws2 = common.createWebSocketConn(getUrl(vendor, env2), {
						auth: { access_token: common.USER.ADMIN.TOKEN },
					});

					const wsGql = common.createWebSocketGql(getUrl(vendor, env1), {
						auth: { access_token: common.USER.ADMIN.TOKEN },
					});

					const wsGql2 = common.createWebSocketGql(getUrl(vendor, env2), {
						auth: { access_token: common.USER.ADMIN.TOKEN },
					});

					// Action
					for (const uid of uids) {
						await ws.subscribe({ collection: localCollectionFirst, uid });
						await ws2.subscribe({ collection: localCollectionFirst, uid });

						await wsGql.subscribe({
							collection: localCollectionFirst,
							jsonQuery: {
								event: true,
								data: {
									id: true,
									name: true,
								},
							},
							uid,
						});

						await wsGql2.subscribe({
							collection: localCollectionFirst,
							jsonQuery: {
								event: true,
								data: {
									id: true,
									name: true,
								},
							},
							uid,
						});

						await ws.unsubscribe(uid);
						await ws2.unsubscribe(uid);
						wsGql.unsubscribe(uid);
						wsGql2.unsubscribe(uid);
					}

					await request(getUrl(vendor, env1))
						.post(`/items/${localCollectionFirst}`)
						.send({ id: pkType === 'string' ? uuid() : undefined, name: uuid() })
						.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

					ws.conn.close();
					ws2.conn.close();
					await wsGql.client.dispose();
					await wsGql2.client.dispose();

					// Assert
					for (const uid of uids) {
						expect(ws.getMessageCount(uid)).toBe(2);
						expect(ws2.getMessageCount(uid)).toBe(2);
						expect(wsGql.getMessageCount(uid)).toBe(0);
						expect(wsGql2.getMessageCount(uid)).toBe(0);
					}
				},
				100000
			);
		});
	});
});
