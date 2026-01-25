import { randomUUID } from 'node:crypto';
import { getUrl } from '@common/config';
import { CreatePermission, CreateRole, CreateUser, CreateVersion } from '@common/functions';
import vendors from '@common/get-dbs-to-test';
import { createWebSocketConn, waitForMatchingMessage } from '@common/transport';
import type { WebSocketCollabResponse } from '@common/types';
import { USER } from '@common/variables';
import { sleep } from '@utils/sleep';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import {
	collectionCollab,
	collectionCollabPrivate,
	collectionCollabRelational,
	collectionCollabRelationalM2O,
	collectionCollabRelationalO2M,
	collectionCollabSingleton,
} from './permissions.seed';

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
			const errorMsg = await waitForMatchingMessage<WebSocketCollabResponse>(ws, (msg) => msg.action === 'error');

			expect(errorMsg).toMatchObject({
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
				role: roleId,
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

			const initAdmin = await waitForMatchingMessage<WebSocketCollabResponse>(
				wsAdmin,
				(msg) => msg.type === 'collab' && msg.action === 'init',
			);

			const room = initAdmin.room!;

			await wsRestricted.sendMessage({
				type: 'collab',
				action: 'join',
				collection: collectionCollab,
				item: itemId,
				version: null,
			});

			await waitForMatchingMessage(wsRestricted, (msg) => msg.type === 'collab' && msg.action === 'init');
			await waitForMatchingMessage(wsAdmin, (msg) => msg.type === 'collab' && msg.action === 'join');

			// Action
			await wsAdmin.sendMessage({ type: 'collab', action: 'focus', room, field: 'title' });

			await waitForMatchingMessage(
				wsRestricted,
				(msg) => msg.type === 'collab' && msg.action === 'focus' && msg.field === 'title',
			);

			await wsAdmin.sendMessage({
				type: 'collab',
				action: 'update',
				room,
				field: 'title',
				changes: 'New Public Title',
			});

			// Assert
			const updateTitle = await waitForMatchingMessage<WebSocketCollabResponse>(
				wsRestricted,
				(msg) => msg.type === 'collab' && msg.action === 'update' && msg.field === 'title',
			);

			expect(updateTitle).toMatchObject({
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
				role: roleId,
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

			const initAdmin = await waitForMatchingMessage<WebSocketCollabResponse>(
				wsAdmin,
				(msg) => msg.type === 'collab' && msg.action === 'init',
			);

			const room = initAdmin.room!;

			await wsRestricted.sendMessage({
				type: 'collab',
				action: 'join',
				collection: collectionCollab,
				item: itemId,
				version: null,
			});

			await waitForMatchingMessage(wsRestricted, (msg) => msg.type === 'collab' && msg.action === 'init');
			await waitForMatchingMessage(wsAdmin, (msg) => msg.type === 'collab' && msg.action === 'join');

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
			const [updateMessage, focusMessage] = await waitForMatchingMessage<WebSocketCollabResponse>(wsRestricted, [
				(msg) => msg.action === 'update' && msg.field === 'title' && msg.changes === null,
				(msg) => msg.action === 'focus' && msg.field === 'title',
			]);

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
				role: roleId,
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
			const errorMsg = await waitForMatchingMessage<WebSocketCollabResponse>(ws, (msg) => msg.action === 'error');

			expect(errorMsg).toMatchObject({
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
				role: roleId,
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

			const initMsg = await waitForMatchingMessage<WebSocketCollabResponse>(
				ws,
				(msg) => msg.type === 'collab' && msg.action === 'init',
			);

			const room = initMsg.room!;

			await ws.sendMessage({
				type: 'collab',
				action: 'update',
				room,
				field: 'content',
				changes: 'Unauthorized Update',
			});

			// Assert
			const errorMsg = await waitForMatchingMessage<WebSocketCollabResponse>(ws, (msg) => msg.action === 'error');

			expect(errorMsg).toMatchObject({
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
				role: roleId,
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

			const errorJoin = await waitForMatchingMessage<WebSocketCollabResponse>(ws, (msg) => msg.action === 'error');

			const ws2 = createWebSocketConn(TEST_URL, { auth: { access_token: userToken } });

			await ws2.sendMessage({
				type: 'collab',
				action: 'join',
				collection: collectionCollab,
				item: itemId,
				version: null,
			});

			const initMsg = await waitForMatchingMessage<WebSocketCollabResponse>(
				ws2,
				(msg) => msg.type === 'collab' && msg.action === 'init',
			);

			const room = initMsg.room!;

			await ws2.sendMessage({
				type: 'collab',
				action: 'update',
				room,
				field: 'unknown_field',
				changes: 'Value',
			});

			const errorUpdate = await waitForMatchingMessage<WebSocketCollabResponse>(ws2, (msg) => msg.action === 'error');

			// Assert
			expect(errorJoin).toMatchObject({
				action: 'error',
				code: 'FORBIDDEN',
				message: expect.stringMatching(/No permission to update field non_existent or field does not exist/i),
			});

			expect(errorUpdate).toMatchObject({
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
				role: roleId,
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

			const initMsg = await waitForMatchingMessage<WebSocketCollabResponse>(ws, (msg) => msg.action === 'init');
			const room = initMsg.room!;

			await ws.sendMessage({
				type: 'collab',
				action: 'discard',
				fields: ['title'],
				room,
			});

			const discardMsg = await waitForMatchingMessage<WebSocketCollabResponse>(ws, (msg) => msg.action === 'discard');

			await ws.sendMessage({
				type: 'collab',
				action: 'discard',
				fields: ['content'],
				room,
			});

			const errorMsg = await waitForMatchingMessage<WebSocketCollabResponse>(ws, (msg) => msg.action === 'error');

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

describe('Extended Security Tests', () => {
	describe('Non-existent Nested Relational Item', () => {
		it.each(vendors)('%s', async (vendor) => {
			const TEST_URL = getUrl(vendor);
			const userToken = `token-${randomUUID()}`;

			// Setup
			const roleId = await CreateRole(vendor, { name: 'Nested Ghost Restricted' });
			await CreateUser(vendor, { role: roleId, token: userToken, email: `${userToken}@example.com` });

			await CreatePermission(vendor, {
				role: roleId as any,
				permissions: [
					{ collection: collectionCollabRelational, action: 'read', fields: ['*'] },
					{ collection: collectionCollabRelational, action: 'update', fields: ['*'] },
					{ collection: collectionCollabRelationalM2O, action: 'read', fields: ['id', 'field_a'] },
				],
			});

			const mainId = randomUUID();
			const ghostM2oId = randomUUID();

			await request(TEST_URL)
				.post(`/items/${collectionCollabRelational}`)
				.send({ id: mainId, name: 'Main Item' })
				.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

			const wsAdmin = createWebSocketConn(TEST_URL, { auth: { access_token: USER.ADMIN.TOKEN } });
			const wsRestricted = createWebSocketConn(TEST_URL, { auth: { access_token: userToken } });

			await wsAdmin.sendMessage({
				type: 'collab',
				action: 'join',
				collection: collectionCollabRelational,
				item: mainId,
				version: null,
			});

			const initAdmin = await waitForMatchingMessage<WebSocketCollabResponse>(wsAdmin, (msg) => msg.action === 'init');
			const room = initAdmin.room!;

			await wsRestricted.sendMessage({
				type: 'collab',
				action: 'join',
				collection: collectionCollabRelational,
				item: mainId,
				version: null,
			});

			await waitForMatchingMessage(wsRestricted, (msg) => msg.action === 'init');

			// Action
			await wsAdmin.sendMessage({
				type: 'collab',
				action: 'update',
				room,
				field: 'm2o_related',
				changes: {
					id: ghostM2oId,
					field_a: 'Public Value',
					field_b: 'SENSITIVE GHOST DATA',
				},
			});

			// Assert
			const updateMsg = await waitForMatchingMessage<WebSocketCollabResponse>(
				wsRestricted,
				(msg) => msg.action === 'update' && msg.field === 'm2o_related',
			);

			expect(updateMsg['changes']).toBeDefined();
			expect(updateMsg['changes']).toHaveProperty('id', ghostM2oId);
			expect(updateMsg['changes']).toHaveProperty('field_a', 'Public Value');
			expect(updateMsg['changes']).not.toHaveProperty('field_b');

			wsAdmin.conn.close();
			wsRestricted.conn.close();
		});
	});

	describe('Singleton Room State Sanitization', () => {
		it.each(vendors)('%s', async (vendor) => {
			const TEST_URL = getUrl(vendor);
			const userToken = `token-${randomUUID()}`;

			// Setup
			const roleId = await CreateRole(vendor, { name: 'Singleton Ghost Restricted' });
			await CreateUser(vendor, { role: roleId, token: userToken, email: `${userToken}@example.com` });

			await CreatePermission(vendor, {
				role: roleId as any,
				permissions: [{ collection: collectionCollabSingleton, action: 'read', fields: ['id'] }],
			});

			await request(TEST_URL)
				.patch(`/items/${collectionCollabSingleton}`)
				.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`)
				.send({ confidential: 'Initial' });

			const wsAdmin = createWebSocketConn(TEST_URL, { auth: { access_token: USER.ADMIN.TOKEN } });

			await wsAdmin.sendMessage({
				type: 'collab',
				action: 'join',
				collection: collectionCollabSingleton,
				item: null,
				version: null,
			});

			const initAdmin = await waitForMatchingMessage<WebSocketCollabResponse>(wsAdmin, (msg) => msg.action === 'init');
			const room = initAdmin.room!;

			// Action
			await wsAdmin.sendMessage({
				type: 'collab',
				action: 'update',
				room,
				field: 'confidential',
				changes: 'SENSITIVE SINGLETON GHOST DATA',
			});

			const wsRestricted = createWebSocketConn(TEST_URL, { auth: { access_token: userToken } });

			await wsRestricted.sendMessage({
				type: 'collab',
				action: 'join',
				collection: collectionCollabSingleton,
				item: null,
				version: null,
			});

			// Assert
			const initRestricted = await waitForMatchingMessage<WebSocketCollabResponse>(
				wsRestricted,
				(msg) => msg.action === 'init',
			);

			expect(initRestricted['changes']).toBeDefined();
			expect(initRestricted['changes']).not.toHaveProperty('confidential');

			wsAdmin.conn.close();
			wsRestricted.conn.close();
		});
	});

	describe('Relational Update Sanitization', () => {
		it.each(vendors)('%s', async (vendor) => {
			const TEST_URL = getUrl(vendor);
			const userToken = `token-${randomUUID()}`;

			// Setup
			const roleId = await CreateRole(vendor, { name: 'Relational Restricted' });
			await CreateUser(vendor, { role: roleId, token: userToken, email: `${userToken}@example.com` });

			await CreatePermission(vendor, {
				role: roleId as any,
				permissions: [
					{ collection: collectionCollabRelational, action: 'read', fields: ['*'] },
					{ collection: collectionCollabRelational, action: 'update', fields: ['*'] },
					{ collection: collectionCollabRelationalM2O, action: 'read', fields: ['id', 'field_a'] },
					{ collection: collectionCollabRelationalO2M, action: 'read', fields: ['id', 'field_a'] },
				],
			});

			const mainId = randomUUID();

			await request(TEST_URL)
				.post(`/items/${collectionCollabRelational}`)
				.send({ id: mainId, name: 'Main Item' })
				.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

			const wsAdmin = createWebSocketConn(TEST_URL, { auth: { access_token: USER.ADMIN.TOKEN } });
			const wsRestricted = createWebSocketConn(TEST_URL, { auth: { access_token: userToken } });

			await wsAdmin.sendMessage({
				type: 'collab',
				action: 'join',
				collection: collectionCollabRelational,
				item: mainId,
				version: null,
			});

			const initAdmin = await waitForMatchingMessage<WebSocketCollabResponse>(wsAdmin, (msg) => msg.action === 'init');
			const room = initAdmin.room!;

			await wsRestricted.sendMessage({
				type: 'collab',
				action: 'join',
				collection: collectionCollabRelational,
				item: mainId,
				version: null,
			});

			await wsAdmin.sendMessage({ type: 'collab', action: 'focus', room, field: 'o2m_related' });

			await wsAdmin.sendMessage({
				type: 'collab',
				action: 'update',
				room,
				field: 'o2m_related',
				changes: {
					create: [
						{
							name: 'New Item',
							field_a: 'Public Create',
							field_b: 'SENSITIVE CREATE DATA',
						},
					],
					update: [
						{
							id: randomUUID(),
							field_a: 'Public Update',
							field_b: 'SENSITIVE UPDATE DATA',
						},
					],
					delete: [],
				},
			});

			const updateO2M = await waitForMatchingMessage<WebSocketCollabResponse>(
				wsRestricted,
				(msg) => msg.action === 'update' && msg.field === 'o2m_related',
			);

			await wsAdmin.sendMessage({ type: 'collab', action: 'focus', room, field: 'm2o_related' });

			await wsAdmin.sendMessage({
				type: 'collab',
				action: 'update',
				room,
				field: 'm2o_related',
				changes: {
					id: randomUUID(),
					field_a: 'Public M2O',
					field_b: 'SENSITIVE M2O DATA',
				},
			});

			const updateM2O = await waitForMatchingMessage<WebSocketCollabResponse>(
				wsRestricted,
				(msg) => msg.action === 'update' && msg.field === 'm2o_related',
			);

			// Assert
			expect(updateO2M).toBeDefined();
			const o2mChanges = updateO2M['changes'] as any;
			expect(o2mChanges.create[0]).toHaveProperty('field_a', 'Public Create');
			expect(o2mChanges.create[0]).not.toHaveProperty('field_b');
			expect(o2mChanges.update[0]).toHaveProperty('field_a', 'Public Update');
			expect(o2mChanges.update[0]).not.toHaveProperty('field_b');

			expect(updateM2O).toBeDefined();
			const m2oChanges = updateM2O['changes'] as any;
			expect(m2oChanges).toHaveProperty('field_a', 'Public M2O');
			expect(m2oChanges).not.toHaveProperty('field_b');

			wsAdmin.conn.close();
			wsRestricted.conn.close();
		});
	});
});

describe('Version Permissions', () => {
	it.each(vendors)('%s', async (vendor) => {
		const TEST_URL = getUrl(vendor);
		const userToken = `token-${randomUUID()}`;

		// Setup
		const roleId = await CreateRole(vendor, { name: 'Version Permissions Test' });
		await CreateUser(vendor, { role: roleId, token: userToken, email: `${userToken}@example.com` });

		await CreatePermission(vendor, {
			role: roleId,
			permissions: [{ collection: collectionCollab, action: 'read', fields: ['*'] }],
		});

		const itemId = randomUUID();

		await request(TEST_URL)
			.post(`/items/${collectionCollab}`)
			.send({ id: itemId, title: 'Original' })
			.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

		const versionResult = await CreateVersion(vendor, {
			collection: collectionCollab,
			item: itemId,
			key: itemId,
			name: 'Secret Version',
		});

		const versionId = versionResult.id;

		const ws = createWebSocketConn(TEST_URL, { auth: { access_token: userToken } });

		await ws.sendMessage({
			type: 'collab',
			action: 'join',
			collection: collectionCollab,
			item: itemId,
			version: versionId,
		});

		const msg = await waitForMatchingMessage<WebSocketCollabResponse>(ws, (msg) => msg.action === 'error');

		// Assert
		expect(msg).toMatchObject({
			action: 'error',
			code: 'FORBIDDEN',
		});

		ws.conn.close();
	});
});
