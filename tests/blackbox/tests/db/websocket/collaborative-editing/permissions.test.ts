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
				code: 'FORBIDDEN',
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

	describe('Rejects unauthorized initialChanges on join', () => {
		it.each(vendors)('%s', async (vendor) => {
			const TEST_URL = getUrl(vendor);
			const userToken = `token-${randomUUID()}`;

			// Setup
			const roleId = await CreateRole(vendor, { name: 'Restricted' });
			await CreateUser(vendor, { role: roleId, token: userToken, email: `${userToken}@example.com` });

			await CreatePermission(vendor, {
				role: roleId as any,
				permissions: [
					{ collection: collectionCollab, action: 'read', fields: ['*'] },
					{ collection: collectionCollab, action: 'update', fields: ['id', 'title'] },
				],
			});

			const itemId = randomUUID();

			await request(TEST_URL)
				.post(`/items/${collectionCollab}`)
				.send({ id: itemId, title: 'Original Title', content: 'Original Content' })
				.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

			const ws = createWebSocketConn(TEST_URL, { auth: { access_token: userToken } });

			// Action
			await ws.sendMessage({
				type: 'collab',
				action: 'join',
				collection: collectionCollab,
				item: itemId,
				version: null,
				initialChanges: { title: 'New Title', content: 'Invalid' },
			});

			// Assert
			const errorMsg = await ws.getMessages(1);

			expect(errorMsg![0]).toMatchObject({
				action: 'error',
				code: 'FORBIDDEN',
				message: expect.stringMatching(/No permission to update field content or field does not exist/i),
			});

			ws.conn.close();
		});
	});

	describe('Rejects unauthorized update message', () => {
		it.each(vendors)('%s', async (vendor) => {
			const TEST_URL = getUrl(vendor);
			const userToken = `token-${randomUUID()}`;

			// Setup
			const roleId = await CreateRole(vendor, { name: 'Restricted' });
			await CreateUser(vendor, { role: roleId, token: userToken, email: `${userToken}@example.com` });

			// Permissions
			await CreatePermission(vendor, {
				role: roleId as any,
				permissions: [
					{ collection: collectionCollab, action: 'read', fields: ['*'] },
					{ collection: collectionCollab, action: 'update', fields: ['id', 'title'] },
				],
			});

			const itemId = randomUUID();

			await request(TEST_URL)
				.post(`/items/${collectionCollab}`)
				.send({ id: itemId, title: 'Original Title', content: 'Original Content' })
				.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

			const ws = createWebSocketConn(TEST_URL, { auth: { access_token: userToken } });

			// Action
			await ws.sendMessage({
				type: 'collab',
				action: 'join',
				collection: collectionCollab,
				item: itemId,
				version: null,
			});

			const initMsg = await ws.getMessages(1);
			const room = initMsg![0]!['room'];

			await ws.sendMessage({
				type: 'collab',
				action: 'update',
				room,
				field: 'content',
				changes: 'Unauthorized Update',
			});

			// Assert
			const errorMsg = await ws.getMessages(1);

			expect(errorMsg![0]).toMatchObject({
				action: 'error',
				code: 'FORBIDDEN',
				message: expect.stringMatching(/No permission to update field content or field does not exist/i),
			});

			ws.conn.close();
		});
	});

	describe('Rejects unknown fields', () => {
		it.each(vendors)('%s', async (vendor) => {
			const TEST_URL = getUrl(vendor);
			const userToken = `token-${randomUUID()}`;

			// Setup
			const roleId = await CreateRole(vendor, { name: 'Full Permission' });
			await CreateUser(vendor, { role: roleId, token: userToken, email: `${userToken}@example.com` });

			await CreatePermission(vendor, {
				role: roleId as any,
				permissions: [
					{ collection: collectionCollab, action: 'read', fields: ['*'] },
					{ collection: collectionCollab, action: 'update', fields: ['*'] },
				],
			});

			const itemId = randomUUID();

			await request(TEST_URL)
				.post(`/items/${collectionCollab}`)
				.send({ id: itemId, title: 'Original' })
				.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

			const ws = createWebSocketConn(TEST_URL, { auth: { access_token: userToken } });

			// Action
			await ws.sendMessage({
				type: 'collab',
				action: 'join',
				collection: collectionCollab,
				item: itemId,
				version: null,
				initialChanges: { non_existent: 'Invalid' },
			});

			const errorJoin = await ws.getMessages(1);

			const ws2 = createWebSocketConn(TEST_URL, { auth: { access_token: userToken } });

			await ws2.sendMessage({
				type: 'collab',
				action: 'join',
				collection: collectionCollab,
				item: itemId,
				version: null,
			});

			const initMsg = await ws2.getMessages(1);
			const room = initMsg![0]!['room'];

			await ws2.sendMessage({
				type: 'collab',
				action: 'update',
				room,
				field: 'unknown_field',
				changes: 'Value',
			});

			const errorUpdate = await ws2.getMessages(1);

			// Assert
			expect(errorJoin![0]).toMatchObject({
				action: 'error',
				code: 'FORBIDDEN',
				message: expect.stringMatching(/No permission to update field non_existent or field does not exist/i),
			});

			expect(errorUpdate![0]).toMatchObject({
				action: 'error',
				code: 'FORBIDDEN',
				message: expect.stringMatching(/No permission to update field unknown_field or field does not exist/i),
			});

			ws.conn.close();
			ws2.conn.close();
		});
	});

	describe('Discard Permissions', () => {
		it.each(vendors)('%s', async (vendor) => {
			const TEST_URL = getUrl(vendor);
			const userToken = `token-${randomUUID()}`;

			// Setup
			const roleId = await CreateRole(vendor, { name: 'Field Restricted Discard' });
			await CreateUser(vendor, { role: roleId, token: userToken, email: `${userToken}@example.com` });

			await CreatePermission(vendor, {
				role: roleId as any,
				permissions: [
					{ collection: collectionCollab, action: 'read', fields: ['*'] },
					{ collection: collectionCollab, action: 'update', fields: ['id', 'title'] }, // content is not updatable
				],
			});

			const itemId = randomUUID();

			await request(TEST_URL)
				.post(`/items/${collectionCollab}`)
				.send({ id: itemId, title: 'Original', content: 'Original' })
				.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

			const ws = createWebSocketConn(TEST_URL, { auth: { access_token: userToken } });

			// Action
			await ws.sendMessage({
				type: 'collab',
				action: 'join',
				collection: collectionCollab,
				item: itemId,
				version: null,
			});

			const initMsg = await waitForMatchingMessage(ws, (m: any) => m.action === 'init');
			const room = (initMsg as any).room;

			await ws.sendMessage({
				type: 'collab',
				action: 'discard',
				fields: ['title'],
				room,
			});

			const discardMsg = await waitForMatchingMessage(ws, (m: any) => m.action === 'discard');

			await ws.sendMessage({
				type: 'collab',
				action: 'discard',
				fields: ['content'],
				room,
			});

			const errorMsg = await waitForMatchingMessage(ws, (m: any) => m.action === 'error');

			// Assert
			expect(discardMsg).toMatchObject({
				action: 'discard',
				fields: ['title'],
			});

			expect(errorMsg).toMatchObject({
				action: 'error',
				code: 'FORBIDDEN',
				message: expect.stringMatching(/No permission to discard field content/i),
			});

			ws.conn.close();
		});
	});
});
