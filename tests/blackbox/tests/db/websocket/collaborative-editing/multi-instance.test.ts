import { ChildProcess, spawn } from 'child_process';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import { join } from 'node:path';
import config, { getUrl, paths } from '@common/config';
import { CreatePermission, CreateRole, CreateUser } from '@common/functions';
import vendors, { type Vendor } from '@common/get-dbs-to-test';
import { createWebSocketConn, waitForMatchingMessage } from '@common/transport';
import type { WebSocketCollabResponse } from '@common/types';
import { USER } from '@common/variables';
import { awaitDirectusConnection } from '@utils/await-connection';
import { sleep } from '@utils/sleep';
import getPort from 'get-port';
import { cloneDeep } from 'lodash-es';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { collectionCollabMultiInstance } from './multi-instance.seed';

describe('Collaborative Editing: Multi-Instance', () => {
	const directusInstances = {} as { [vendor: string]: ChildProcess };
	const instance2Urls = {} as Record<Vendor, string>;
	const instance2Logs = {} as Record<Vendor, string>;

	beforeAll(async () => {
		const promises = [];

		for (const vendor of vendors) {
			const env2 = cloneDeep(config.envs[vendor]);

			const p2 = await getPort();
			env2.PORT = String(p2);

			const s2 = spawn('node', [paths.cli, 'start'], { cwd: paths.cwd, env: env2 });

			if (process.env['TEST_SAVE_LOGS']) {
				instance2Logs[vendor] = '';

				s2.stdout.on('data', (data) => {
					instance2Logs[vendor] += data.toString();
				});

				s2.stderr.on('data', (data) => {
					instance2Logs[vendor] += data.toString();
				});
			}

			directusInstances[vendor] = s2;
			instance2Urls[vendor] = `http://127.0.0.1:${p2}`;

			promises.push(awaitDirectusConnection(p2));
		}

		await Promise.all(promises);
	}, 180_000);

	afterAll(async () => {
		for (const vendor of vendors) {
			if (process.env['TEST_SAVE_LOGS'] && instance2Logs[vendor]) {
				fs.writeFileSync(join(paths.cwd, `server-log-${vendor}-instance-2.txt`), instance2Logs[vendor]!);
			}

			directusInstances[vendor]?.kill();
		}
	});

	beforeEach(async () => {
		// Ensure collaborative editing is enabled before every test
		for (const vendor of vendors) {
			await request(getUrl(vendor))
				.patch('/settings')
				.send({ collaborative_editing_enabled: true })
				.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);
		}
	});

	describe('Basic Cross-Node Consistency', () => {
		describe('Cross-Instance Update', () => {
			it.each(vendors)('%s', async (vendor) => {
				const itemId = randomUUID();

				// Setup
				await request(getUrl(vendor))
					.post(`/items/${collectionCollabMultiInstance}`)
					.send({ id: itemId, title: 'Inter Instance' })
					.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

				const ws1 = createWebSocketConn(getUrl(vendor), { auth: { access_token: USER.ADMIN.TOKEN } });
				const ws2 = createWebSocketConn(instance2Urls[vendor]!, { auth: { access_token: USER.ADMIN.TOKEN } });

				await ws1.sendMessage({
					type: 'collab',
					action: 'join',
					collection: collectionCollabMultiInstance,
					item: itemId,
					version: null,
				});

				const init1 = await waitForMatchingMessage<WebSocketCollabResponse>(
					ws1,
					(msg) => msg.type === 'collab' && msg.action === 'init',
				);

				const room = init1.room!;

				await ws2.sendMessage({
					type: 'collab',
					action: 'join',
					collection: collectionCollabMultiInstance,
					item: itemId,
					version: null,
				});

				await waitForMatchingMessage(ws2, (msg) => msg.type === 'collab' && msg.action === 'init');
				await waitForMatchingMessage(ws1, (msg) => msg.type === 'collab' && msg.action === 'join');

				// Action
				await ws1.sendMessage({ type: 'collab', action: 'focus', room, field: 'title' });

				await waitForMatchingMessage(
					ws2,
					(msg) => msg.type === 'collab' && msg.action === 'focus' && msg.field === 'title',
				);

				await ws1.sendMessage({ type: 'collab', action: 'update', room, field: 'title', changes: 'Cross' });

				// Assert
				const updateMsg = await waitForMatchingMessage<WebSocketCollabResponse>(
					ws2,
					(msg) => msg.type === 'collab' && msg.action === 'update' && msg.changes === 'Cross',
				);

				expect(updateMsg).toMatchObject({ type: 'collab', action: 'update', changes: 'Cross', room });

				ws1.conn.close();
				ws2.conn.close();
			});
		});

		describe('Cross-Instance Leave', () => {
			it.each(vendors)('%s', async (vendor) => {
				const itemId = randomUUID();

				// Setup
				await request(getUrl(vendor))
					.post(`/items/${collectionCollabMultiInstance}`)
					.send({ id: itemId, title: 'Leave Test' })
					.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

				const ws1 = createWebSocketConn(getUrl(vendor), { auth: { access_token: USER.ADMIN.TOKEN } });
				const ws2 = createWebSocketConn(instance2Urls[vendor]!, { auth: { access_token: USER.ADMIN.TOKEN } });

				await ws1.sendMessage({
					type: 'collab',
					action: 'join',
					collection: collectionCollabMultiInstance,
					item: itemId,
					version: null,
				});

				const init1 = await waitForMatchingMessage<WebSocketCollabResponse>(
					ws1,
					(msg) => msg.type === 'collab' && msg.action === 'init',
				);

				const room = init1.room!;
				const ws1ConnId = init1.connection;

				await ws2.sendMessage({
					type: 'collab',
					action: 'join',
					collection: collectionCollabMultiInstance,
					item: itemId,
					version: null,
				});

				await waitForMatchingMessage(ws2, (msg) => msg.type === 'collab' && msg.action === 'init');
				await waitForMatchingMessage(ws1, (msg) => msg.type === 'collab' && msg.action === 'join');

				// Action
				await ws1.sendMessage({ type: 'collab', action: 'leave', room });

				// Assert
				await waitForMatchingMessage(
					ws2,
					(msg) => msg.action === 'leave' && msg.connection === ws1ConnId && msg.room === room,
				);

				ws1.conn.close();
				ws2.conn.close();
			});
		});

		describe('Cross-Instance Discard', () => {
			it.each(vendors)('%s', async (vendor) => {
				const itemId = randomUUID();

				// Setup
				await request(getUrl(vendor))
					.post(`/items/${collectionCollabMultiInstance}`)
					.send({ id: itemId, title: 'Discard Test' })
					.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

				const ws1 = createWebSocketConn(getUrl(vendor), { auth: { access_token: USER.ADMIN.TOKEN } });
				const ws2 = createWebSocketConn(instance2Urls[vendor]!, { auth: { access_token: USER.ADMIN.TOKEN } });

				await ws1.sendMessage({
					type: 'collab',
					action: 'join',
					collection: collectionCollabMultiInstance,
					item: itemId,
					version: null,
				});

				const init1 = await ws1.getMessages(1);
				const room = init1![0]!.room;

				await ws2.sendMessage({
					type: 'collab',
					action: 'join',
					collection: collectionCollabMultiInstance,
					item: itemId,
					version: null,
				});

				await ws2.getMessages(1); // Drain INIT
				await ws1.getMessages(1); // Drain JOIN (ws2 joined)

				await ws1.sendMessage({ type: 'collab', action: 'focus', room, field: 'title' });
				await waitForMatchingMessage(ws2, (msg) => msg.action === 'focus');

				await ws1.sendMessage({ type: 'collab', action: 'update', room, field: 'title', changes: 'Pending' });
				await waitForMatchingMessage(ws2, (msg) => msg.action === 'update');

				// Action
				await ws1.sendMessage({ type: 'collab', action: 'discard', room });

				// Assert
				await waitForMatchingMessage(
					ws2,
					(msg) => msg.action === 'discard' && msg.fields?.includes('title') && msg.room === room,
				);

				ws1.conn.close();
				ws2.conn.close();
			});
		});

		describe('Multi-Node Sync on Join', () => {
			it.each(vendors)('%s', async (vendor) => {
				const itemId = randomUUID();

				// Setup
				await request(getUrl(vendor))
					.post(`/items/${collectionCollabMultiInstance}`)
					.send({ id: itemId, title: 'Sync Test' })
					.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

				const ws1 = createWebSocketConn(getUrl(vendor), { auth: { access_token: USER.ADMIN.TOKEN } });

				await ws1.sendMessage({
					type: 'collab',
					action: 'join',
					collection: collectionCollabMultiInstance,
					item: itemId,
					version: null,
				});

				const init1 = await ws1.getMessages(1);
				const room = init1![0]!['room'];

				await ws1.sendMessage({ type: 'collab', action: 'focus', room, field: 'title' });
				await ws1.sendMessage({ type: 'collab', action: 'update', room, field: 'title', changes: 'Dirty State' });

				// Wait for state to be committed through Node A to Redis
				await sleep(500);

				// Action: Join on Node B
				const ws2 = createWebSocketConn(instance2Urls[vendor]!, { auth: { access_token: USER.ADMIN.TOKEN } });

				await ws2.sendMessage({
					type: 'collab',
					action: 'join',
					collection: collectionCollabMultiInstance,
					item: itemId,
					version: null,
				});

				// Assert
				const init2 = await ws2.getMessages(1);

				expect(init2![0]).toMatchObject({
					type: 'collab',
					action: 'init',
					changes: { title: 'Dirty State' },
					focuses: { [init1![0]!['connection']]: 'title' }, // Keep bracket for dynamic key access
				});

				ws1.conn.close();
				ws2.conn.close();
			});
		});
	});

	describe('Distributed Optimizations', () => {
		describe('Cluster-Wide Disablement', () => {
			it.each(vendors)('%s', async (vendor) => {
				const itemId = randomUUID();

				// Setup
				await request(getUrl(vendor))
					.post(`/items/${collectionCollabMultiInstance}`)
					.send({ id: itemId, title: 'Disablement Test' })
					.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

				const ws1 = createWebSocketConn(getUrl(vendor), { auth: { access_token: USER.ADMIN.TOKEN } });
				const ws2 = createWebSocketConn(instance2Urls[vendor]!, { auth: { access_token: USER.ADMIN.TOKEN } });

				await ws1.sendMessage({
					type: 'collab',
					action: 'join',
					collection: collectionCollabMultiInstance,
					item: itemId,
					version: null,
				});

				await ws1.getMessages(1); // Drain INIT

				await ws2.sendMessage({
					type: 'collab',
					action: 'join',
					collection: collectionCollabMultiInstance,
					item: itemId,
					version: null,
				});

				await ws2.getMessages(1); // Drain INIT
				await ws1.getMessages(1); // Drain JOIN (ws2 joined)

				// Action
				const p1Promise = waitForMatchingMessage<WebSocketCollabResponse>(
					ws1,
					(msg) => msg.action === 'error' && msg.code === 'SERVICE_UNAVAILABLE',
				);

				const p2Promise = waitForMatchingMessage<WebSocketCollabResponse>(
					ws2,
					(msg) => msg.action === 'error' && msg.code === 'SERVICE_UNAVAILABLE',
				);

				await Promise.all([
					(async () => {
						await sleep(500);
						return request(getUrl(vendor))
							.patch('/settings')
							.send({ collaborative_editing_enabled: false })
							.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);
					})(),
					p1Promise,
					p2Promise,
				]);

				// Clean up
				await request(getUrl(vendor))
					.patch('/settings')
					.send({ collaborative_editing_enabled: true })
					.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

				ws1.conn.close();
				ws2.conn.close();
			});
		});

		describe('Inter-Instance Sequence Integrity', () => {
			it.each(vendors)('%s', async (vendor) => {
				const itemId = randomUUID();

				// Setup
				await request(getUrl(vendor))
					.post(`/items/${collectionCollabMultiInstance}`)
					.send({ id: itemId, title: 'Sequence Test' })
					.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

				const ws1 = createWebSocketConn(getUrl(vendor), { auth: { access_token: USER.ADMIN.TOKEN } });
				const ws2 = createWebSocketConn(instance2Urls[vendor]!, { auth: { access_token: USER.ADMIN.TOKEN } });

				await ws1.sendMessage({
					type: 'collab',
					action: 'join',
					collection: collectionCollabMultiInstance,
					item: itemId,
					version: null,
				});

				const init1 = await ws1.getMessages(1);
				const room = init1![0]!['room'];

				await ws2.sendMessage({
					type: 'collab',
					action: 'join',
					collection: collectionCollabMultiInstance,
					item: itemId,
					version: null,
				});

				await ws2.getMessages(1); // Drain INIT
				await ws1.getMessages(1); // Drain JOIN (ws2 joined)

				// Action: Send multiple updates sequentially to ensure order over bus
				await ws1.sendMessage({ type: 'collab', action: 'focus', room, field: 'title' });
				const m0 = await waitForMatchingMessage<WebSocketCollabResponse>(ws2, (msg) => msg.action === 'focus');

				await ws1.sendMessage({ type: 'collab', action: 'update', room, field: 'title', changes: 'U1' });

				const m1 = await waitForMatchingMessage<WebSocketCollabResponse>(
					ws2,
					(msg) => msg.action === 'update' && msg.changes === 'U1',
				);

				await ws1.sendMessage({ type: 'collab', action: 'update', room, field: 'title', changes: 'U2' });

				const m2 = await waitForMatchingMessage<WebSocketCollabResponse>(
					ws2,
					(msg) => msg.action === 'update' && msg.changes === 'U2',
				);

				await ws1.sendMessage({ type: 'collab', action: 'update', room, field: 'title', changes: 'U3' });

				const m3 = await waitForMatchingMessage<WebSocketCollabResponse>(
					ws2,
					(msg) => msg.action === 'update' && msg.changes === 'U3',
				);

				// Assert: All messages must have strictly incrementing order
				expect(m1.order).toBe(m0.order! + 1);
				expect(m2.order).toBe(m1.order! + 1);
				expect(m3.order).toBe(m2.order! + 1);

				ws1.conn.close();
				ws2.conn.close();
			});
		});

		describe('Concurrent Closure Race (Leader Election)', () => {
			it.each(vendors)('%s', async (vendor) => {
				const itemId = randomUUID();

				// Setup
				await request(getUrl(vendor))
					.post(`/items/${collectionCollabMultiInstance}`)
					.send({ id: itemId, title: 'Race Test' })
					.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

				const ws1 = createWebSocketConn(getUrl(vendor), { auth: { access_token: USER.ADMIN.TOKEN } });
				const ws2 = createWebSocketConn(instance2Urls[vendor]!, { auth: { access_token: USER.ADMIN.TOKEN } });

				await ws1.sendMessage({
					type: 'collab',
					action: 'join',
					collection: collectionCollabMultiInstance,
					item: itemId,
					version: null,
				});

				const init1 = await waitForMatchingMessage<WebSocketCollabResponse>(
					ws1,
					(msg) => msg.type === 'collab' && msg.action === 'init',
				);

				const room = init1.room!;

				await ws2.sendMessage({
					type: 'collab',
					action: 'join',
					collection: collectionCollabMultiInstance,
					item: itemId,
					version: null,
				});

				await waitForMatchingMessage(ws2, (msg) => msg.type === 'collab' && msg.action === 'init');
				await waitForMatchingMessage(ws1, (msg) => msg.type === 'collab' && msg.action === 'join');

				// Action: Delete item via REST on Node A.
				await request(getUrl(vendor))
					.delete(`/items/${collectionCollabMultiInstance}/${itemId}`)
					.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

				// Assert: Both clients should receive the delete message via bus
				await waitForMatchingMessage(ws1, (msg) => msg.action === 'delete' && msg.room === room);
				await waitForMatchingMessage(ws2, (msg) => msg.action === 'delete' && msg.room === room);

				ws1.conn.close();
				ws2.conn.close();
			});
		});
	});

	describe('Reactive Invalidation (Cross-Instance REST Updates)', () => {
		describe('Reactive REST Update', () => {
			it.each(vendors)('%s', async (vendor) => {
				const TEST_URL = getUrl(vendor);
				const instance2Url = instance2Urls[vendor]!;
				const userToken = `token-${randomUUID()}`;

				// Setup
				const roleId = await CreateRole(vendor, { name: 'Reactive Role' });

				await CreateUser(vendor, { role: roleId, token: userToken, email: `${userToken}@example.com` });

				await CreatePermission(vendor, {
					role: roleId,
					permissions: [{ collection: collectionCollabMultiInstance, action: 'read', fields: ['*'] }],
				});

				const itemId = randomUUID();

				await request(TEST_URL)
					.post(`/items/${collectionCollabMultiInstance}`)
					.send({ id: itemId, title: 'Original' })
					.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

				const ws = createWebSocketConn(instance2Url, { auth: { access_token: userToken } });

				await ws.sendMessage({
					type: 'collab',
					action: 'join',
					collection: collectionCollabMultiInstance,
					item: itemId,
					version: null,
				});

				const initMsg = await waitForMatchingMessage<WebSocketCollabResponse>(
					ws,
					(msg) => msg.type === 'collab' && msg.action === 'init',
				);

				const room = initMsg.room!;

				// Action
				await request(TEST_URL)
					.patch(`/items/${collectionCollabMultiInstance}/${itemId}`)
					.send({ title: 'New' })
					.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

				// Assert
				await waitForMatchingMessage(ws, (msg) => msg.action === 'save' && msg.room === room);

				ws.conn.close();
			});
		});
	});

	describe('Versioned Content', () => {
		describe('Cross-Instance Version Update', () => {
			it.each(vendors)('%s', async (vendor) => {
				const itemId = randomUUID();

				// Setup
				const itemRes = await request(getUrl(vendor))
					.post(`/items/${collectionCollabMultiInstance}`)
					.send({ id: itemId, title: 'Main Item' })
					.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

				expect(itemRes.status).toBe(200);

				const versionRes = await request(getUrl(vendor))
					.post(`/versions`)
					.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`)
					.send({
						collection: collectionCollabMultiInstance,
						item: itemId,
						key: 'v1',
						name: 'Version 1',
					});

				expect(versionRes.status).toBe(200);
				const version = versionRes.body.data;

				const ws1 = createWebSocketConn(getUrl(vendor), { auth: { access_token: USER.ADMIN.TOKEN } });
				const ws2 = createWebSocketConn(instance2Urls[vendor]!, { auth: { access_token: USER.ADMIN.TOKEN } });

				await ws1.sendMessage({
					type: 'collab',
					action: 'join',
					collection: collectionCollabMultiInstance,
					item: itemId,
					version: version.id,
				});

				const init1 = await waitForMatchingMessage<WebSocketCollabResponse>(
					ws1,
					(msg) => msg.type === 'collab' && msg.action === 'init',
				);

				const room = init1.room!;

				await ws2.sendMessage({
					type: 'collab',
					action: 'join',
					collection: collectionCollabMultiInstance,
					item: itemId,
					version: version.id,
				});

				await waitForMatchingMessage(ws2, (msg) => msg.type === 'collab' && msg.action === 'init');
				await waitForMatchingMessage(ws1, (msg) => msg.type === 'collab' && msg.action === 'join');

				// Action
				await ws1.sendMessage({ type: 'collab', action: 'focus', room, field: 'title' });

				await waitForMatchingMessage(
					ws2,
					(msg) => msg.type === 'collab' && msg.action === 'focus' && msg.field === 'title',
				);

				await ws1.sendMessage({
					type: 'collab',
					action: 'update',
					room,
					field: 'title',
					changes: 'Version Update',
				});

				// Assert
				const updateMsg = await waitForMatchingMessage<WebSocketCollabResponse>(
					ws2,
					(msg) => msg.type === 'collab' && msg.action === 'update' && msg.changes === 'Version Update',
				);

				expect(updateMsg).toMatchObject({
					type: 'collab',
					action: 'update',
					changes: 'Version Update',
					room,
				});

				ws1.conn.close();
				ws2.conn.close();
			});
		});

		describe('Reactive Version Save', () => {
			it.each(vendors)('%s', async (vendor) => {
				const TEST_URL = getUrl(vendor);
				const instance2Url = instance2Urls[vendor]!;
				const userToken = `token-${randomUUID()}`;

				// Setup
				const roleId = await CreateRole(vendor, { name: 'Version Role' });

				await CreateUser(vendor, { role: roleId, token: userToken, email: `${userToken}@example.com` });

				await CreatePermission(vendor, {
					role: roleId,
					permissions: [
						{ collection: collectionCollabMultiInstance, action: 'read', fields: ['*'] },
						{ collection: 'directus_versions', action: 'read', fields: ['*'] },
					],
				});

				const itemId = randomUUID();

				await request(TEST_URL)
					.post(`/items/${collectionCollabMultiInstance}`)
					.send({ id: itemId, title: 'Original' })
					.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

				const versionRes = await request(TEST_URL)
					.post(`/versions`)
					.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`)
					.send({
						collection: collectionCollabMultiInstance,
						item: itemId,
						key: 'v_backend',
						name: 'Backend Version',
					});

				const version = versionRes.body.data;

				const ws = createWebSocketConn(instance2Url, { auth: { access_token: userToken } });

				await ws.sendMessage({
					type: 'collab',
					action: 'join',
					collection: collectionCollabMultiInstance,
					item: itemId,
					version: version.id,
				});

				const initMsg = await waitForMatchingMessage<WebSocketCollabResponse>(
					ws,
					(msg) => msg.type === 'collab' && msg.action === 'init',
				);

				const room = initMsg.room!;

				// Action
				await request(getUrl(vendor))
					.post(`/versions/${version.id}/save`)
					.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`)
					.send({ title: 'Backend Save' });

				// Assert
				await waitForMatchingMessage(ws, (msg) => msg.action === 'save' && msg.room === room);

				ws.conn.close();
			});
		});
	});
});
