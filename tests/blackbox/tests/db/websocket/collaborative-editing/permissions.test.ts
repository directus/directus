import { randomUUID } from 'node:crypto';
import { getUrl } from '@common/config';
import { CreatePermission, CreateRole, CreateUser } from '@common/functions';
import vendors from '@common/get-dbs-to-test';
import { createWebSocketConn, waitForMatchingMessage } from '@common/transport';
import { USER } from '@common/variables';
import { sleep } from '@utils/sleep';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { collectionCollab, collectionCollabPrivate } from './permissions.seed';

describe('Collaborative Editing: Permissions', () => {
	describe('Join Permissions', () => {
		it.each(vendors)('%s', async (vendor) => {
			const TEST_URL = getUrl(vendor);
			const userToken = `token-${randomUUID()}`;

			// Setup
			const roleId = await CreateRole(vendor, { name: 'Restricted' });
			await CreateUser(vendor, { role: roleId, token: userToken, email: `${userToken}@example.com` });

			const itemId = randomUUID();

			await request(TEST_URL)
				.post(`/items/${collectionCollabPrivate}`)
				.send({ id: itemId, secret: 'Hidden' })
				.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

			const ws = createWebSocketConn(TEST_URL, { auth: { access_token: userToken } });

			// Action
			await ws.sendMessage({
				type: 'collab',
				action: 'join',
				collection: collectionCollabPrivate,
				item: itemId,
				version: null,
			});

			// Assert
			const errorMsg = await ws.getMessages(1);

			expect(errorMsg![0]).toMatchObject({
				action: 'error',
				code: 'INVALID_PAYLOAD',
			});

			ws.conn.close();
		});
	});

	describe('Field-level Permissions', () => {
		it.each(vendors)('%s', async (vendor) => {
			const TEST_URL = getUrl(vendor);
			const userToken = `token-${randomUUID()}`;

			// Setup
			const roleId = await CreateRole(vendor, { name: 'Field Restricted' });
			await CreateUser(vendor, { role: roleId, token: userToken, email: `${userToken}@example.com` });

			await CreatePermission(vendor, {
				role: roleId as any,
				permissions: [
					{ collection: collectionCollab, action: 'read', fields: ['id', 'title'] },
					{ collection: collectionCollab, action: 'update', fields: ['id', 'title'] },
				],
			});

			const itemId = randomUUID();

			await request(TEST_URL)
				.post(`/items/${collectionCollab}`)
				.send({ id: itemId, title: 'Public Title', content: 'Secret Content' })
				.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

			const wsAdmin = createWebSocketConn(TEST_URL, { auth: { access_token: USER.ADMIN.TOKEN } });
			const wsRestricted = createWebSocketConn(TEST_URL, { auth: { access_token: userToken } });

			await wsAdmin.sendMessage({
				type: 'collab',
				action: 'join',
				collection: collectionCollab,
				item: itemId,
				version: null,
			});

			const initAdmin = await wsAdmin.getMessages(1);
			const room = initAdmin![0]!['room'];

			await wsRestricted.sendMessage({
				type: 'collab',
				action: 'join',
				collection: collectionCollab,
				item: itemId,
				version: null,
			});

			await wsRestricted.getMessages(1); // Drain INIT
			await wsAdmin.getMessages(1); // Drain JOIN

			// Action
			await wsAdmin.sendMessage({ type: 'collab', action: 'focus', room, field: 'title' });

			await wsRestricted.getMessages(1); // Drain FOCUS

			await wsAdmin.sendMessage({
				type: 'collab',
				action: 'update',
				room,
				field: 'title',
				changes: 'New Public Title',
			});

			// Assert
			const updateTitle = await wsRestricted.getMessages(1);

			expect(updateTitle![0]).toMatchObject({
				type: 'collab',
				action: 'update',
				field: 'title',
				changes: 'New Public Title',
			});

			// Action
			await wsAdmin.sendMessage({ type: 'collab', action: 'focus', room, field: 'content' });

			await wsAdmin.sendMessage({
				type: 'collab',
				action: 'update',
				room,
				field: 'content',
				changes: 'New Secret Content',
			});

			// Assert
			await sleep(500);
			expect(wsRestricted.getUnreadMessageCount()).toBe(0);

			wsAdmin.conn.close();
			wsRestricted.conn.close();
		});
	});

	describe('Field-level Permissions (Unset Propagation)', () => {
		it.each(vendors)('%s', async (vendor) => {
			const TEST_URL = getUrl(vendor);
			const userToken = `token-${randomUUID()}`;

			// Setup
			const roleId = await CreateRole(vendor, { name: 'Field Restricted' });
			await CreateUser(vendor, { role: roleId, token: userToken, email: `${userToken}@example.com` });

			await CreatePermission(vendor, {
				role: roleId as any,
				permissions: [
					{ collection: collectionCollab, action: 'read', fields: ['id', 'title'] },
					{ collection: collectionCollab, action: 'update', fields: ['id', 'title'] },
				],
			});

			const itemId = randomUUID();

			await request(TEST_URL)
				.post(`/items/${collectionCollab}`)
				.send({ id: itemId, title: 'Public Title', content: 'Secret Content' })
				.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

			const wsAdmin = createWebSocketConn(TEST_URL, { auth: { access_token: USER.ADMIN.TOKEN } });
			const wsRestricted = createWebSocketConn(TEST_URL, { auth: { access_token: userToken } });

			await wsAdmin.sendMessage({
				type: 'collab',
				action: 'join',
				collection: collectionCollab,
				item: itemId,
				version: null,
			});

			const initAdmin = await wsAdmin.getMessages(1);
			const room = initAdmin![0]!['room'];

			await wsRestricted.sendMessage({
				type: 'collab',
				action: 'join',
				collection: collectionCollab,
				item: itemId,
				version: null,
			});

			await wsRestricted.getMessages(1); // Drain INIT
			await wsAdmin.getMessages(1); // Drain JOIN

			await wsAdmin.sendMessage({
				type: 'collab',
				action: 'update',
				room,
				field: 'content',
				changes: null, // Unset
			});

			// Restricted user should not receive the update
			await sleep(500);
			expect(wsRestricted.getUnreadMessageCount()).toBe(0);

			await wsAdmin.sendMessage({
				type: 'collab',
				action: 'update',
				room,
				field: 'title',
				changes: null, // Unset
			});

			await sleep(500);

			// Restricted user should receive the update and focus (order not guaranteed)
			const [updateMessage, focusMessage] = (await waitForMatchingMessage(wsRestricted, [
				(m: any) => m['action'] === 'update' && m['field'] === 'title' && m['changes'] === null,
				(m: any) => m['action'] === 'focus' && m['field'] === 'title',
			])) as any[];

			expect(updateMessage).toBeDefined();
			expect(focusMessage).toBeDefined();

			expect(focusMessage).toMatchObject({
				type: 'collab',
				action: 'focus',
				room,
				field: 'title',
			});

			expect(updateMessage).toMatchObject({
				type: 'collab',
				action: 'update',
				room,
				field: 'title',
				changes: null,
			});

			wsAdmin.conn.close();
			wsRestricted.conn.close();
		});
	});
});
