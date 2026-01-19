import { ChildProcess, spawn } from 'child_process';
import { randomUUID } from 'node:crypto';
import config, { getUrl, paths } from '@common/config';
import { CreatePermission, CreateRole, CreateUser } from '@common/functions';
import vendors, { type Vendor } from '@common/get-dbs-to-test';
import { createWebSocketConn } from '@common/transport';
import { USER } from '@common/variables';
import { awaitDirectusConnection } from '@utils/await-connection';
import getPort from 'get-port';
import { cloneDeep } from 'lodash-es';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { collectionCollabMultiInstance } from './multi-instance.seed';

describe('Collaborative Editing: Multi-Instance', () => {
	const directusInstances = {} as { [vendor: string]: ChildProcess };
	const instance2Urls = {} as Record<Vendor, string>;

	beforeAll(async () => {
		const promises = [];

		for (const vendor of vendors) {
			const env2 = cloneDeep(config.envs[vendor]);

			const p2 = await getPort();
			env2.PORT = String(p2);

			const s2 = spawn('node', [paths.cli, 'start'], { cwd: paths.cwd, env: env2 });

			directusInstances[vendor] = s2;
			instance2Urls[vendor] = `http://127.0.0.1:${p2}`;

			promises.push(awaitDirectusConnection(p2));
		}

		await Promise.all(promises);
	}, 180_000);

	afterAll(async () => {
		for (const vendor of vendors) {
			directusInstances[vendor]?.kill();
		}
	});

	describe('Cross-instance Propagation (Redis)', () => {
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
			await ws1.getMessages(1); // Drain JOIN

			// Action
			await ws1.sendMessage({ type: 'collab', action: 'focus', room, field: 'title' });

			await ws2.getMessages(1); // Drain FOCUS

			await ws1.sendMessage({ type: 'collab', action: 'update', room, field: 'title', changes: 'Cross' });

			// Assert
			const updateMsg = await ws2.getMessages(1);
			expect(updateMsg![0]).toMatchObject({ type: 'collab', action: 'update', changes: 'Cross' });

			ws1.conn.close();
			ws2.conn.close();
		});
	});

	describe('Reactive Invalidation (REST Updates)', () => {
		it.each(vendors)('%s', async (vendor) => {
			const TEST_URL = getUrl(vendor);
			const userToken = `token-${randomUUID()}`;

			// Setup
			const roleId = await CreateRole(vendor, { name: 'Reactive Role' });

			await CreateUser(vendor, { role: roleId, token: userToken, email: `${userToken}@example.com` });

			await CreatePermission(vendor, {
				role: roleId as any,
				permissions: [{ collection: collectionCollabMultiInstance, action: 'read', fields: ['*'] }],
			});

			const itemId = randomUUID();

			await request(TEST_URL)
				.post(`/items/${collectionCollabMultiInstance}`)
				.send({ id: itemId, title: 'Original' })
				.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

			const ws = createWebSocketConn(TEST_URL, { auth: { access_token: userToken } });

			await ws.sendMessage({
				type: 'collab',
				action: 'join',
				collection: collectionCollabMultiInstance,
				item: itemId,
				version: null,
			});

			const init = await ws.getMessages(1);
			const room = init![0]!['room'];

			// Action
			await request(TEST_URL)
				.patch(`/items/${collectionCollabMultiInstance}/${itemId}`)
				.send({ title: 'New' })
				.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

			// Assert
			const saveMsg = await ws.getMessages(1);
			expect(saveMsg![0]).toMatchObject({ type: 'collab', action: 'save', room });

			ws.conn.close();
		});
	});
});
