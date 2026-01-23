import { randomUUID } from 'node:crypto';
import { getUrl } from '@common/config';
import { CreatePermission, CreateRole, CreateUser } from '@common/functions';
import vendors from '@common/get-dbs-to-test';
import { createWebSocketConn, waitForMatchingMessage } from '@common/transport';
import { USER } from '@common/variables';
import { sleep } from '@utils/sleep';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { collectionCollabSingleton } from './singleton.seed';

const ROLE_NAME = 'Test Collab Singleton Role';

describe('Collaborative Editing: Singleton', () => {
	describe('Singleton Access', () => {
		it.each(vendors)('%s', async (vendor) => {
			const TEST_URL = getUrl(vendor);
			const userToken = `token-${randomUUID()}`;

			let roleId: string | undefined;
			let userId: string | undefined;

			try {
				// Setup
				await request(TEST_URL)
					.patch(`/items/${collectionCollabSingleton}`)
					.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`)
					.send({ title: 'Singleton Item', is_published: true });

				roleId = await CreateRole(vendor, { name: ROLE_NAME });
				userId = await CreateUser(vendor, { role: roleId!, token: userToken, email: `${userToken}@example.com` });

				await CreatePermission(vendor, {
					role: roleId as any,
					permissions: [
						{
							collection: collectionCollabSingleton,
							action: 'read',
							permissions: { title: { _neq: 'Hidden' } },
							fields: ['*'],
						},
						{
							collection: collectionCollabSingleton,
							action: 'update',
							permissions: { title: { _neq: 'Hidden' } },
							fields: ['title'],
						},
					],
				});

				const ws1 = createWebSocketConn(TEST_URL, { auth: { access_token: USER.ADMIN.TOKEN } });
				const ws2 = createWebSocketConn(TEST_URL, { auth: { access_token: userToken } });

				await Promise.all([ws1.waitForState(ws1.conn.OPEN), ws2.waitForState(ws2.conn.OPEN)]);

				// Action
				await ws1.sendMessage({
					type: 'collab',
					action: 'join',
					collection: collectionCollabSingleton,
					item: null,
					version: null,
				});

				const init1 = await ws1.getMessages(1);
				const room = init1![0]!['room'];

				await ws2.sendMessage({
					type: 'collab',
					action: 'join',
					collection: collectionCollabSingleton,
					item: null,
					version: null,
				});

				await ws2.getMessages(1); // Drain INIT
				await ws1.getMessages(1); // Drain JOIN

				// Action
				await ws1.sendMessage({ type: 'collab', action: 'focus', room, field: 'title' });

				await sleep(100);

				await ws1.sendMessage({
					type: 'collab',
					action: 'update',
					room,
					field: 'title',
					changes: 'Updated By Admin',
				});

				// Assert
				const updateMsg = await waitForMatchingMessage(
					ws2,
					(msg) => msg['type'] === 'collab' && msg['action'] === 'update' && msg['field'] === 'title',
				);

				expect(updateMsg).toMatchObject({
					type: 'collab',
					action: 'update',
					room,
					field: 'title',
					changes: 'Updated By Admin',
				});

				ws1.conn.close();
				ws2.conn.close();
			} finally {
				// Cleanup
				try {
					if (userId)
						await request(TEST_URL).delete(`/users/${userId}`).set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);
					if (roleId)
						await request(TEST_URL).delete(`/roles/${roleId}`).set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);
				} catch {
					// Cleanup failed
				}
			}
		});
	});

	describe('Reactive Invalidation', () => {
		it.each(vendors)('%s', async (vendor) => {
			const TEST_URL = getUrl(vendor);
			const userToken = `token-${randomUUID()}`;

			let roleId: string | undefined;
			let userId: string | undefined;

			try {
				// Setup
				await request(TEST_URL)
					.patch(`/items/${collectionCollabSingleton}`)
					.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`)
					.send({ title: 'Singleton External Test', is_published: true });

				roleId = await CreateRole(vendor, { name: `${ROLE_NAME}-external` });
				userId = await CreateUser(vendor, { role: roleId!, token: userToken, email: `${userToken}@example.com` });

				await CreatePermission(vendor, {
					role: roleId as any,
					permissions: [
						{
							collection: collectionCollabSingleton,
							action: 'read',
							fields: ['*'],
						},
					],
				});

				const ws = createWebSocketConn(TEST_URL, { auth: { access_token: userToken } });

				await ws.waitForState(ws.conn.OPEN);

				// Action
				await ws.sendMessage({
					type: 'collab',
					action: 'join',
					collection: collectionCollabSingleton,
					item: null,
					version: null,
				});

				const init = await ws.getMessages(1); // Drain INIT
				const room = init![0]!['room'];

				// Action
				await request(TEST_URL)
					.patch(`/items/${collectionCollabSingleton}`)
					.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`)
					.send({ title: 'Updated Externally' });

				// Assert
				const saveMsg = await waitForMatchingMessage(ws, (msg) => msg['type'] === 'collab' && msg['action'] === 'save');

				expect(saveMsg).toMatchObject({
					type: 'collab',
					action: 'save',
					room,
				});

				ws.conn.close();
			} finally {
				// Cleanup
				try {
					if (userId)
						await request(TEST_URL).delete(`/users/${userId}`).set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);
					if (roleId)
						await request(TEST_URL).delete(`/roles/${roleId}`).set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);
				} catch {
					// Cleanup failed
				}
			}
		});
	});
});
