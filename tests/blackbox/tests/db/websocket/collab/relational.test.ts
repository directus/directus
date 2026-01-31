import { randomUUID } from 'node:crypto';
import { getUrl } from '@common/config';
import { CreatePermission, CreateRole, CreateUser } from '@common/functions';
import vendors from '@common/get-dbs-to-test';
import { createWebSocketConn, waitForMatchingMessage } from '@common/transport';
import type { WebSocketCollabResponse } from '@common/types';
import { USER } from '@common/variables';
import { sleep } from '@utils/sleep';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import {
	collectionCollabRelational,
	collectionCollabRelationalA2O,
	collectionCollabRelationalA2OJunction,
	collectionCollabRelationalDeepO2M,
	collectionCollabRelationalM2M,
	collectionCollabRelationalM2MJunction,
	collectionCollabRelationalM2O,
	collectionCollabRelationalO2M,
} from './relational.seed';

describe('Collaborative Editing: Relational', () => {
	describe('M2O Field-Level Permissions', () => {
		it.each(vendors)('%s', async (vendor) => {
			const TEST_URL = getUrl(vendor);
			const userToken = `token-${randomUUID()}`;

			// Setup
			const roleId = await CreateRole(vendor, { name: 'M2O Field Restricted' });
			await CreateUser(vendor, { role: roleId, token: userToken, email: `${userToken}@example.com` });

			await CreatePermission(vendor, {
				role: roleId as any,
				permissions: [
					{ collection: collectionCollabRelational, action: 'read', fields: ['*'] },
					{ collection: collectionCollabRelational, action: 'update', fields: ['*'] },
					{ collection: collectionCollabRelationalM2O, action: 'read', fields: ['id', 'name', 'field_a'] },
				],
			});

			const m2oId = randomUUID();
			const mainId = randomUUID();

			await request(TEST_URL)
				.post(`/items/${collectionCollabRelationalM2O}`)
				.send({ id: m2oId, name: 'M2O Item', field_a: 'Value A', field_b: 'Value B' })
				.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

			await request(TEST_URL)
				.post(`/items/${collectionCollabRelational}`)
				.send({ id: mainId, name: 'Main Item', m2o_related: m2oId })
				.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

			const wsAdmin = createWebSocketConn(TEST_URL, { auth: { access_token: USER.ADMIN.TOKEN } });
			const wsRestricted = createWebSocketConn(TEST_URL, { auth: { access_token: userToken } });

			// Action
			await wsAdmin.sendMessage({
				type: 'collab',
				action: 'join',
				collection: collectionCollabRelational,
				item: mainId,
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
				collection: collectionCollabRelational,
				item: mainId,
				version: null,
			});

			await waitForMatchingMessage(wsRestricted, (msg) => msg.type === 'collab' && msg.action === 'init');
			await waitForMatchingMessage(wsAdmin, (msg) => msg.type === 'collab' && msg.action === 'join');

			await wsAdmin.sendMessage({ type: 'collab', action: 'focus', room, field: 'm2o_related' });

			await waitForMatchingMessage(
				wsRestricted,
				(msg) => msg.type === 'collab' && msg.action === 'focus' && msg.field === 'm2o_related',
			);

			await wsAdmin.sendMessage({
				type: 'collab',
				action: 'update',
				room,
				field: 'm2o_related',
				changes: { id: m2oId, name: 'Updated M2O', field_a: 'New A', field_b: 'New B' },
			});

			// Assert
			const updateMsg = await waitForMatchingMessage<WebSocketCollabResponse>(
				wsRestricted,
				(msg) => msg.type === 'collab' && msg.action === 'update' && msg.field === 'm2o_related',
			);

			expect(updateMsg).toMatchObject({
				type: 'collab',
				action: 'update',
				field: 'm2o_related',
			});

			const changes = updateMsg['changes'];

			expect(changes).toHaveProperty('field_a', 'New A');
			expect(changes).not.toHaveProperty('field_b');

			wsAdmin.conn.close();
			wsRestricted.conn.close();
		});
	});

	describe('M2O No Collection Access', () => {
		it.each(vendors)('%s', async (vendor) => {
			const TEST_URL = getUrl(vendor);
			const userToken = `token-${randomUUID()}`;

			// Setup
			const roleId = await CreateRole(vendor, { name: 'No M2O Access' });
			await CreateUser(vendor, { role: roleId, token: userToken, email: `${userToken}@example.com` });

			await CreatePermission(vendor, {
				role: roleId as any,
				permissions: [
					{ collection: collectionCollabRelational, action: 'read', fields: ['*'] },
					{ collection: collectionCollabRelational, action: 'update', fields: ['*'] },
				],
			});

			const m2oId = randomUUID();
			const mainId = randomUUID();

			await request(TEST_URL)
				.post(`/items/${collectionCollabRelationalM2O}`)
				.send({ id: m2oId, name: 'M2O Item', field_a: 'A', field_b: 'B' })
				.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

			await request(TEST_URL)
				.post(`/items/${collectionCollabRelational}`)
				.send({ id: mainId, name: 'Main Item', m2o_related: m2oId })
				.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

			const wsAdmin = createWebSocketConn(TEST_URL, { auth: { access_token: USER.ADMIN.TOKEN } });
			const wsRestricted = createWebSocketConn(TEST_URL, { auth: { access_token: userToken } });

			// Action
			await wsAdmin.sendMessage({
				type: 'collab',
				action: 'join',
				collection: collectionCollabRelational,
				item: mainId,
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
				collection: collectionCollabRelational,
				item: mainId,
				version: null,
			});

			await waitForMatchingMessage(wsRestricted, (msg) => msg.type === 'collab' && msg.action === 'init');
			await waitForMatchingMessage(wsAdmin, (msg) => msg.type === 'collab' && msg.action === 'join');

			await wsAdmin.sendMessage({ type: 'collab', action: 'focus', room, field: 'm2o_related' });

			await waitForMatchingMessage(
				wsRestricted,
				(msg) => msg.type === 'collab' && msg.action === 'focus' && msg.field === 'm2o_related',
			);

			await wsAdmin.sendMessage({
				type: 'collab',
				action: 'update',
				room,
				field: 'm2o_related',
				changes: { id: m2oId, name: 'Updated', field_a: 'New A', field_b: 'New B' },
			});

			// Assert
			await sleep(500);
			const msgs = (await wsRestricted.getMessages(wsRestricted.getUnreadMessageCount())) || [];
			expect(msgs.find((msg) => msg.action === 'update')).toBeUndefined();

			wsAdmin.conn.close();
			wsRestricted.conn.close();
		});
	});

	describe('O2M Field-Level Permissions (Create)', () => {
		it.each(vendors)('%s', async (vendor) => {
			const TEST_URL = getUrl(vendor);
			const userToken = `token-${randomUUID()}`;

			// Setup
			const roleId = await CreateRole(vendor, { name: 'O2M Create Restricted' });
			await CreateUser(vendor, { role: roleId, token: userToken, email: `${userToken}@example.com` });

			await CreatePermission(vendor, {
				role: roleId as any,
				permissions: [
					{ collection: collectionCollabRelational, action: 'read', fields: ['*'] },
					{ collection: collectionCollabRelational, action: 'update', fields: ['*'] },
					{ collection: collectionCollabRelationalO2M, action: 'read', fields: ['id', 'name', 'field_a'] },
				],
			});

			const mainId = randomUUID();

			await request(TEST_URL)
				.post(`/items/${collectionCollabRelational}`)
				.send({ id: mainId, name: 'Main Item' })
				.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

			const wsAdmin = createWebSocketConn(TEST_URL, { auth: { access_token: USER.ADMIN.TOKEN } });
			const wsRestricted = createWebSocketConn(TEST_URL, { auth: { access_token: userToken } });

			// Action
			await wsAdmin.sendMessage({
				type: 'collab',
				action: 'join',
				collection: collectionCollabRelational,
				item: mainId,
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
				collection: collectionCollabRelational,
				item: mainId,
				version: null,
			});

			await waitForMatchingMessage(wsRestricted, (msg) => msg.type === 'collab' && msg.action === 'init');
			await waitForMatchingMessage(wsAdmin, (msg) => msg.type === 'collab' && msg.action === 'join');

			await wsAdmin.sendMessage({ type: 'collab', action: 'focus', room, field: 'o2m_related' });

			await waitForMatchingMessage(
				wsRestricted,
				(msg) => msg.type === 'collab' && msg.action === 'focus' && msg.field === 'o2m_related',
			);

			await wsAdmin.sendMessage({
				type: 'collab',
				action: 'update',
				room,
				field: 'o2m_related',
				changes: {
					create: [{ id: randomUUID(), name: 'O2M Item', field_a: 'Value A', field_b: 'Value B' }],
					update: [],
					delete: [],
				},
			});

			// Assert
			const updateMsg = await waitForMatchingMessage<WebSocketCollabResponse>(
				wsRestricted,
				(msg) => msg.type === 'collab' && msg.action === 'update' && msg.field === 'o2m_related',
			);

			expect(updateMsg).toMatchObject({
				type: 'collab',
				action: 'update',
				field: 'o2m_related',
			});

			const changes = updateMsg['changes'];

			expect(changes?.create?.[0]).toHaveProperty('field_a', 'Value A');
			expect(changes?.create?.[0]).not.toHaveProperty('field_b');

			wsAdmin.conn.close();
			wsRestricted.conn.close();
		});
	});

	describe('O2M Field-Level Permissions (Update)', () => {
		it.each(vendors)('%s', async (vendor) => {
			const TEST_URL = getUrl(vendor);
			const userToken = `token-${randomUUID()}`;

			// Setup
			const roleId = await CreateRole(vendor, { name: 'O2M Update Restricted' });
			await CreateUser(vendor, { role: roleId, token: userToken, email: `${userToken}@example.com` });

			await CreatePermission(vendor, {
				role: roleId as any,
				permissions: [
					{ collection: collectionCollabRelational, action: 'read', fields: ['*'] },
					{ collection: collectionCollabRelational, action: 'update', fields: ['*'] },
					{ collection: collectionCollabRelationalO2M, action: 'read', fields: ['id', 'name', 'field_a'] },
				],
			});

			const mainId = randomUUID();
			const o2mId = randomUUID();

			await request(TEST_URL)
				.post(`/items/${collectionCollabRelationalO2M}`)
				.send({ id: o2mId, name: 'O2M Item', field_a: 'Old A', field_b: 'Old B' })
				.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

			await request(TEST_URL)
				.post(`/items/${collectionCollabRelational}`)
				.send({ id: mainId, name: 'Main Item', o2m_related: [o2mId] })
				.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

			const wsAdmin = createWebSocketConn(TEST_URL, { auth: { access_token: USER.ADMIN.TOKEN } });
			const wsRestricted = createWebSocketConn(TEST_URL, { auth: { access_token: userToken } });

			// Action
			await wsAdmin.sendMessage({
				type: 'collab',
				action: 'join',
				collection: collectionCollabRelational,
				item: mainId,
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
				collection: collectionCollabRelational,
				item: mainId,
				version: null,
			});

			await waitForMatchingMessage(wsRestricted, (msg) => msg.type === 'collab' && msg.action === 'init');
			await waitForMatchingMessage(wsAdmin, (msg) => msg.type === 'collab' && msg.action === 'join');

			await wsAdmin.sendMessage({ type: 'collab', action: 'focus', room, field: 'o2m_related' });

			await waitForMatchingMessage(
				wsRestricted,
				(msg) => msg.type === 'collab' && msg.action === 'focus' && msg.field === 'o2m_related',
			);

			await wsAdmin.sendMessage({
				type: 'collab',
				action: 'update',
				room,
				field: 'o2m_related',
				changes: {
					create: [],
					update: [{ id: o2mId, field_a: 'New A', field_b: 'New B' }],
					delete: [],
				},
			});

			// Assert
			const updateMsg = await waitForMatchingMessage<WebSocketCollabResponse>(
				wsRestricted,
				(msg) => msg.type === 'collab' && msg.action === 'update' && msg.field === 'o2m_related',
			);

			expect(updateMsg).toMatchObject({
				type: 'collab',
				action: 'update',
				field: 'o2m_related',
			});

			const changes = updateMsg['changes'];

			expect(changes?.update?.[0]).toHaveProperty('field_a', 'New A');
			expect(changes?.update?.[0]).not.toHaveProperty('field_b');

			wsAdmin.conn.close();
			wsRestricted.conn.close();
		});
	});

	describe('O2M No Collection Access', () => {
		it.each(vendors)('%s', async (vendor) => {
			const TEST_URL = getUrl(vendor);
			const userToken = `token-${randomUUID()}`;

			// Setup
			const roleId = await CreateRole(vendor, { name: 'No O2M Access' });
			await CreateUser(vendor, { role: roleId, token: userToken, email: `${userToken}@example.com` });

			await CreatePermission(vendor, {
				role: roleId as any,
				permissions: [
					{ collection: collectionCollabRelational, action: 'read', fields: ['*'] },
					{ collection: collectionCollabRelational, action: 'update', fields: ['*'] },
				],
			});

			const mainId = randomUUID();

			await request(TEST_URL)
				.post(`/items/${collectionCollabRelational}`)
				.send({ id: mainId, name: 'Main Item' })
				.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

			const wsAdmin = createWebSocketConn(TEST_URL, { auth: { access_token: USER.ADMIN.TOKEN } });
			const wsRestricted = createWebSocketConn(TEST_URL, { auth: { access_token: userToken } });

			// Action
			await wsAdmin.sendMessage({
				type: 'collab',
				action: 'join',
				collection: collectionCollabRelational,
				item: mainId,
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
				collection: collectionCollabRelational,
				item: mainId,
				version: null,
			});

			await waitForMatchingMessage(wsRestricted, (msg) => msg.type === 'collab' && msg.action === 'init');
			await waitForMatchingMessage(wsAdmin, (msg) => msg.type === 'collab' && msg.action === 'join');

			await wsAdmin.sendMessage({ type: 'collab', action: 'focus', room, field: 'o2m_related' });

			await waitForMatchingMessage(
				wsRestricted,
				(msg) => msg.type === 'collab' && msg.action === 'focus' && msg.field === 'o2m_related',
			);

			await wsAdmin.sendMessage({
				type: 'collab',
				action: 'update',
				room,
				field: 'o2m_related',
				changes: {
					create: [{ id: randomUUID(), name: 'O2M Item', field_a: 'A', field_b: 'B' }],
					update: [],
					delete: [],
				},
			});

			// Assert
			await sleep(500);
			const msgs = (await wsRestricted.getMessages(wsRestricted.getUnreadMessageCount())) || [];
			const updateMsg = msgs.find((msg) => msg.action === 'update') as WebSocketCollabResponse;

			if (updateMsg) {
				expect(updateMsg.changes?.create || []).toHaveLength(0);
			}

			wsAdmin.conn.close();
			wsRestricted.conn.close();
		});
	});

	describe('Deep O2M Nesting', () => {
		it.each(vendors)('%s', async (vendor) => {
			const TEST_URL = getUrl(vendor);
			const userToken = `token-${randomUUID()}`;

			// Setup
			const roleId = await CreateRole(vendor, { name: 'Deep O2M Restricted' });
			await CreateUser(vendor, { role: roleId, token: userToken, email: `${userToken}@example.com` });

			await CreatePermission(vendor, {
				role: roleId as any,
				permissions: [
					{ collection: collectionCollabRelational, action: 'read', fields: ['*'] },
					{ collection: collectionCollabRelational, action: 'update', fields: ['*'] },
					{ collection: collectionCollabRelationalO2M, action: 'read', fields: ['*'] },
					{ collection: collectionCollabRelationalO2M, action: 'update', fields: ['*'] },
					{ collection: collectionCollabRelationalDeepO2M, action: 'read', fields: ['id', 'name', 'field_a'] },
				],
			});

			const mainId = randomUUID();
			const o2mId = randomUUID();
			const deepO2mId = randomUUID();

			await request(TEST_URL)
				.post(`/items/${collectionCollabRelational}`)
				.send({ id: mainId, name: 'Main Item' })
				.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

			await request(TEST_URL)
				.post(`/items/${collectionCollabRelationalO2M}`)
				.send({ id: o2mId, name: 'O2M Item', parent_id: mainId })
				.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

			await request(TEST_URL)
				.post(`/items/${collectionCollabRelationalDeepO2M}`)
				.send({ id: deepO2mId, name: 'Deep O2M Item', parent_id: o2mId, field_a: 'Old A', field_b: 'Old B' })
				.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

			const wsAdmin = createWebSocketConn(TEST_URL, { auth: { access_token: USER.ADMIN.TOKEN } });
			const wsRestricted = createWebSocketConn(TEST_URL, { auth: { access_token: userToken } });

			// Action
			await wsAdmin.sendMessage({
				type: 'collab',
				action: 'join',
				collection: collectionCollabRelational,
				item: mainId,
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
				collection: collectionCollabRelational,
				item: mainId,
				version: null,
			});

			await waitForMatchingMessage(wsRestricted, (msg) => msg.type === 'collab' && msg.action === 'init');
			await waitForMatchingMessage(wsAdmin, (msg) => msg.type === 'collab' && msg.action === 'join');

			await wsAdmin.sendMessage({
				type: 'collab',
				action: 'focus',
				room,
				field: 'o2m_related',
			});

			await waitForMatchingMessage(
				wsRestricted,
				(msg) => msg.type === 'collab' && msg.action === 'focus' && msg.field === 'o2m_related',
			);

			await wsAdmin.sendMessage({
				type: 'collab',
				action: 'update',
				room,
				field: 'o2m_related',
				changes: {
					create: [],
					update: [
						{
							id: o2mId,
							deep_o2m_related: {
								create: [],
								update: [{ id: deepO2mId, field_a: 'New A', field_b: 'New B' }],
								delete: [],
							},
						},
					],
					delete: [],
				},
			});

			// Assert
			const updateMsg = await waitForMatchingMessage<WebSocketCollabResponse>(
				wsRestricted,
				(msg) => msg.type === 'collab' && msg.action === 'update' && msg.field === 'o2m_related',
			);

			expect(updateMsg).toMatchObject({
				type: 'collab',
				action: 'update',
				field: 'o2m_related',
			});

			const deepUpdate = (updateMsg as any)!['changes']?.update?.[0]?.deep_o2m_related?.update?.[0];

			expect(deepUpdate).toHaveProperty('field_a', 'New A');
			expect(deepUpdate).not.toHaveProperty('field_b');

			wsAdmin.conn.close();
			wsRestricted.conn.close();
		});
	});

	describe('M2M Field-Level Permissions', () => {
		it.each(vendors)('%s', async (vendor) => {
			const TEST_URL = getUrl(vendor);
			const userToken = `token-${randomUUID()}`;

			// Setup
			const roleId = await CreateRole(vendor, { name: 'M2M Field Restricted' });
			await CreateUser(vendor, { role: roleId, token: userToken, email: `${userToken}@example.com` });

			await CreatePermission(vendor, {
				role: roleId as any,
				permissions: [
					{ collection: collectionCollabRelational, action: 'read', fields: ['*'] },
					{ collection: collectionCollabRelational, action: 'update', fields: ['*'] },
					{ collection: collectionCollabRelationalM2MJunction, action: 'read', fields: ['*'] },
					{ collection: collectionCollabRelationalM2M, action: 'read', fields: ['id', 'name', 'field_a'] },
				],
			});

			const m2mId = randomUUID();
			const mainId = randomUUID();

			await request(TEST_URL)
				.post(`/items/${collectionCollabRelationalM2M}`)
				.send({ id: m2mId, name: 'M2M Item', field_a: 'Value A', field_b: 'Value B' })
				.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

			await request(TEST_URL)
				.post(`/items/${collectionCollabRelational}`)
				.send({ id: mainId, name: 'Main Item' })
				.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

			const wsAdmin = createWebSocketConn(TEST_URL, { auth: { access_token: USER.ADMIN.TOKEN } });
			const wsRestricted = createWebSocketConn(TEST_URL, { auth: { access_token: userToken } });

			// Action
			await wsAdmin.sendMessage({
				type: 'collab',
				action: 'join',
				collection: collectionCollabRelational,
				item: mainId,
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
				collection: collectionCollabRelational,
				item: mainId,
				version: null,
			});

			await waitForMatchingMessage(wsRestricted, (msg) => msg.type === 'collab' && msg.action === 'init');
			await waitForMatchingMessage(wsAdmin, (msg) => msg.type === 'collab' && msg.action === 'join');

			await wsAdmin.sendMessage({ type: 'collab', action: 'focus', room, field: 'm2m_related' });

			await waitForMatchingMessage(
				wsRestricted,
				(msg) => msg.type === 'collab' && msg.action === 'focus' && msg.field === 'm2m_related',
			);

			await wsAdmin.sendMessage({
				type: 'collab',
				action: 'update',
				room,
				field: 'm2m_related',
				changes: {
					create: [
						{
							[`${collectionCollabRelationalM2M}_id`]: {
								id: m2mId,
								name: 'M2M Item',
								field_a: 'Value A',
								field_b: 'Value B',
							},
						},
					],
					update: [],
					delete: [],
				},
			});

			// Assert
			const updateMsg = await waitForMatchingMessage<WebSocketCollabResponse>(
				wsRestricted,
				(msg) => msg.type === 'collab' && msg.action === 'update' && msg.field === 'm2m_related',
			);

			expect(updateMsg).toMatchObject({
				type: 'collab',
				action: 'update',
				field: 'm2m_related',
			});

			const changes = updateMsg['changes'];
			const nestedItem = changes?.create?.[0]?.[`${collectionCollabRelationalM2M}_id`];

			expect(nestedItem).toBeDefined();
			expect(nestedItem).toHaveProperty('field_a', 'Value A');
			expect(nestedItem).not.toHaveProperty('field_b');

			wsAdmin.conn.close();
			wsRestricted.conn.close();
		});
	});

	describe('M2M No Collection Access', () => {
		it.each(vendors)('%s', async (vendor) => {
			const TEST_URL = getUrl(vendor);
			const userToken = `token-${randomUUID()}`;

			// Setup
			const roleId = await CreateRole(vendor, { name: 'No M2M Access' });
			await CreateUser(vendor, { role: roleId, token: userToken, email: `${userToken}@example.com` });

			await CreatePermission(vendor, {
				role: roleId as any,
				permissions: [
					{ collection: collectionCollabRelational, action: 'read', fields: ['*'] },
					{ collection: collectionCollabRelational, action: 'update', fields: ['*'] },
					{ collection: collectionCollabRelationalM2MJunction, action: 'read', fields: ['*'] },
					// No access to M2M target collection
				],
			});

			const m2mId = randomUUID();
			const mainId = randomUUID();

			await request(TEST_URL)
				.post(`/items/${collectionCollabRelationalM2M}`)
				.send({ id: m2mId, name: 'M2M Item', field_a: 'A', field_b: 'B' })
				.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

			await request(TEST_URL)
				.post(`/items/${collectionCollabRelational}`)
				.send({ id: mainId, name: 'Main Item' })
				.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

			const wsAdmin = createWebSocketConn(TEST_URL, { auth: { access_token: USER.ADMIN.TOKEN } });
			const wsRestricted = createWebSocketConn(TEST_URL, { auth: { access_token: userToken } });

			// Action
			await wsAdmin.sendMessage({
				type: 'collab',
				action: 'join',
				collection: collectionCollabRelational,
				item: mainId,
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
				collection: collectionCollabRelational,
				item: mainId,
				version: null,
			});

			await waitForMatchingMessage(wsRestricted, (msg) => msg.type === 'collab' && msg.action === 'init');
			await waitForMatchingMessage(wsAdmin, (msg) => msg.type === 'collab' && msg.action === 'join');

			await wsAdmin.sendMessage({ type: 'collab', action: 'focus', room, field: 'm2m_related' });

			await waitForMatchingMessage(
				wsRestricted,
				(msg) => msg.type === 'collab' && msg.action === 'focus' && msg.field === 'm2m_related',
			);

			await wsAdmin.sendMessage({
				type: 'collab',
				action: 'update',
				room,
				field: 'm2m_related',
				changes: {
					create: [
						{
							[`${collectionCollabRelationalM2M}_id`]: {
								id: m2mId,
								name: 'M2M Item',
								field_a: 'A',
								field_b: 'B',
							},
						},
					],
					update: [],
					delete: [],
				},
			});

			// Assert
			await sleep(1000);
			const msgs = (await wsRestricted.getMessages(wsRestricted.getUnreadMessageCount())) || [];

			const updateMsg = msgs.find(
				(msg) => msg.type === 'collab' && msg.action === 'update' && msg.field === 'm2m_related',
			) as WebSocketCollabResponse;

			if (updateMsg) {
				const changes = updateMsg.changes;

				// Nested M2M data should be filtered out
				const nestedItem = changes?.create?.[0]?.[`${collectionCollabRelationalM2M}_id`];
				expect(nestedItem).toBeUndefined();
			}

			wsAdmin.conn.close();
			wsRestricted.conn.close();
		});
	});

	describe('M2A Field-Level Permissions', () => {
		it.each(vendors)('%s', async (vendor) => {
			const TEST_URL = getUrl(vendor);
			const userToken = `token-${randomUUID()}`;

			// Setup
			const roleId = await CreateRole(vendor, { name: 'M2A Field Restricted' });
			await CreateUser(vendor, { role: roleId, token: userToken, email: `${userToken}@example.com` });

			await CreatePermission(vendor, {
				role: roleId as any,
				permissions: [
					{ collection: collectionCollabRelational, action: 'read', fields: ['*'] },
					{ collection: collectionCollabRelational, action: 'update', fields: ['*'] },
					{ collection: collectionCollabRelationalA2OJunction, action: 'read', fields: ['*'] },
					{ collection: collectionCollabRelationalA2O, action: 'read', fields: ['id', 'name', 'field_a'] },
				],
			});

			const a2oId = randomUUID();
			const mainId = randomUUID();

			await request(TEST_URL)
				.post(`/items/${collectionCollabRelationalA2O}`)
				.send({ id: a2oId, name: 'A2O Item', field_a: 'Value A', field_b: 'Value B' })
				.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

			await request(TEST_URL)
				.post(`/items/${collectionCollabRelational}`)
				.send({ id: mainId, name: 'Main Item' })
				.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

			const wsAdmin = createWebSocketConn(TEST_URL, { auth: { access_token: USER.ADMIN.TOKEN } });
			const wsRestricted = createWebSocketConn(TEST_URL, { auth: { access_token: userToken } });

			// Action
			await wsAdmin.sendMessage({
				type: 'collab',
				action: 'join',
				collection: collectionCollabRelational,
				item: mainId,
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
				collection: collectionCollabRelational,
				item: mainId,
				version: null,
			});

			await waitForMatchingMessage(wsRestricted, (msg) => msg.type === 'collab' && msg.action === 'init');
			await waitForMatchingMessage(wsAdmin, (msg) => msg.type === 'collab' && msg.action === 'join');

			await wsAdmin.sendMessage({ type: 'collab', action: 'focus', room, field: 'a2o_items' });

			await waitForMatchingMessage(
				wsRestricted,
				(msg) => msg.type === 'collab' && msg.action === 'focus' && msg.field === 'a2o_items',
			);

			await wsAdmin.sendMessage({
				type: 'collab',
				action: 'update',
				room,
				field: 'a2o_items',
				changes: {
					create: [
						{
							collection: collectionCollabRelationalA2O,
							item: { id: a2oId, name: 'A2O Item', field_a: 'Value A', field_b: 'Value B' },
						},
					],
					update: [],
					delete: [],
				},
			});

			// Assert
			const updateMsg = await waitForMatchingMessage<WebSocketCollabResponse>(
				wsRestricted,
				(msg) => msg.type === 'collab' && msg.action === 'update' && msg.field === 'a2o_items',
			);

			expect(updateMsg).toMatchObject({
				type: 'collab',
				action: 'update',
				field: 'a2o_items',
			});

			const changes = updateMsg['changes'];
			const nestedItem = changes?.create?.[0]?.item;

			expect(nestedItem).toBeDefined();
			expect(nestedItem).toHaveProperty('field_a', 'Value A');
			expect(nestedItem).not.toHaveProperty('field_b');

			wsAdmin.conn.close();
			wsRestricted.conn.close();
		});
	});

	describe('M2A No Collection Access', () => {
		it.each(vendors)('%s', async (vendor) => {
			const TEST_URL = getUrl(vendor);
			const userToken = `token-${randomUUID()}`;

			// Setup
			const roleId = await CreateRole(vendor, { name: 'No M2A Access' });
			await CreateUser(vendor, { role: roleId, token: userToken, email: `${userToken}@example.com` });

			await CreatePermission(vendor, {
				role: roleId as any,
				permissions: [
					{ collection: collectionCollabRelational, action: 'read', fields: ['*'] },
					{ collection: collectionCollabRelational, action: 'update', fields: ['*'] },
					{ collection: collectionCollabRelationalA2OJunction, action: 'read', fields: ['*'] },
					// No access to A2O target collection
				],
			});

			const a2oId = randomUUID();
			const mainId = randomUUID();

			await request(TEST_URL)
				.post(`/items/${collectionCollabRelationalA2O}`)
				.send({ id: a2oId, name: 'A2O Item', field_a: 'A', field_b: 'B' })
				.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

			await request(TEST_URL)
				.post(`/items/${collectionCollabRelational}`)
				.send({ id: mainId, name: 'Main Item' })
				.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

			const wsAdmin = createWebSocketConn(TEST_URL, { auth: { access_token: USER.ADMIN.TOKEN } });
			const wsRestricted = createWebSocketConn(TEST_URL, { auth: { access_token: userToken } });

			// Action
			await wsAdmin.sendMessage({
				type: 'collab',
				action: 'join',
				collection: collectionCollabRelational,
				item: mainId,
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
				collection: collectionCollabRelational,
				item: mainId,
				version: null,
			});

			await waitForMatchingMessage(wsRestricted, (msg: any) => msg.type === 'collab' && msg.action === 'init');
			await waitForMatchingMessage(wsAdmin, (msg: any) => msg.type === 'collab' && msg.action === 'join');

			await wsAdmin.sendMessage({ type: 'collab', action: 'focus', room, field: 'a2o_items' });

			await waitForMatchingMessage(
				wsRestricted,
				(msg) => msg.type === 'collab' && msg.action === 'focus' && msg.field === 'a2o_items',
			);

			await wsAdmin.sendMessage({
				type: 'collab',
				action: 'update',
				room,
				field: 'a2o_items',
				changes: {
					create: [
						{
							collection: collectionCollabRelationalA2O,
							item: { id: a2oId, name: 'A2O Item', field_a: 'A', field_b: 'B' },
						},
					],
					update: [],
					delete: [],
				},
			});

			// Assert
			const updateMsg = await waitForMatchingMessage<WebSocketCollabResponse>(
				wsRestricted,
				(msg) => msg.type === 'collab' && msg.action === 'update' && msg.field === 'a2o_items',
				5000,
			);

			const changes = updateMsg.changes;

			// Nested A2O data should be filtered out
			const nestedItem = changes?.create?.[0]?.item;
			expect(nestedItem).toBeUndefined();

			wsAdmin.conn.close();
			wsRestricted.conn.close();
		});
	});

	describe('Mixed A2O Permissions', () => {
		it.each(vendors)('%s', async (vendor) => {
			const TEST_URL = getUrl(vendor);
			const userToken = `token-${randomUUID()}`;

			// Setup
			const roleId = await CreateRole(vendor, { name: 'Mixed A2O Restricted' });
			await CreateUser(vendor, { role: roleId, token: userToken, email: `${userToken}@example.com` });

			await CreatePermission(vendor, {
				role: roleId as any,
				permissions: [
					{ collection: collectionCollabRelational, action: 'read', fields: ['*'] },
					{ collection: collectionCollabRelational, action: 'update', fields: ['*'] },
					{ collection: collectionCollabRelationalA2OJunction, action: 'read', fields: ['*'] },
					{ collection: collectionCollabRelationalA2O, action: 'read', fields: ['*'] },
					// NO permission for collectionCollabRelationalM2O
				],
			});

			const mainId = randomUUID();
			const a2oId = randomUUID();
			const m2oId = randomUUID();

			await request(TEST_URL)
				.post(`/items/${collectionCollabRelational}`)
				.send({ id: mainId, name: 'Main Item' })
				.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

			await request(TEST_URL)
				.post(`/items/${collectionCollabRelationalA2O}`)
				.send({ id: a2oId, name: 'A2O Item' })
				.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

			await request(TEST_URL)
				.post(`/items/${collectionCollabRelationalM2O}`)
				.send({ id: m2oId, name: 'M2O Item' })
				.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

			const wsAdmin = createWebSocketConn(TEST_URL, { auth: { access_token: USER.ADMIN.TOKEN } });
			const wsRestricted = createWebSocketConn(TEST_URL, { auth: { access_token: userToken } });

			// Action
			await wsAdmin.sendMessage({
				type: 'collab',
				action: 'join',
				collection: collectionCollabRelational,
				item: mainId,
				version: null,
			});

			const initAdmin = await waitForMatchingMessage<WebSocketCollabResponse>(
				wsAdmin,
				(msg) => msg.type === 'collab' && msg.action === 'init',
			);

			const room = initAdmin.room;

			await wsRestricted.sendMessage({
				type: 'collab',
				action: 'join',
				collection: collectionCollabRelational,
				item: mainId,
				version: null,
			});

			await waitForMatchingMessage(wsRestricted, (msg: any) => msg.type === 'collab' && msg.action === 'init');
			await waitForMatchingMessage(wsAdmin, (msg: any) => msg.type === 'collab' && msg.action === 'join');

			await wsAdmin.sendMessage({
				type: 'collab',
				action: 'focus',
				room,
				field: 'a2o_items',
			});

			await waitForMatchingMessage(
				wsRestricted,
				(msg: any) => msg.type === 'collab' && msg.action === 'focus' && msg.field === 'a2o_items',
			);

			await wsAdmin.sendMessage({
				type: 'collab',
				action: 'update',
				room,
				field: 'a2o_items',
				changes: {
					create: [
						{
							collection: collectionCollabRelationalA2O,
							item: { id: a2oId },
						},
						{
							collection: collectionCollabRelationalM2O,
							item: { id: m2oId },
						},
					],
					update: [],
					delete: [],
				},
			});

			// Assert
			const updateMsg = (await waitForMatchingMessage(
				wsRestricted,
				(msg: any) => msg.type === 'collab' && msg.action === 'update' && msg.field === 'a2o_items',
			)) as any;

			const createItems = updateMsg.changes?.create || [];
			expect(createItems).toHaveLength(2);

			const allowedItem = createItems.find((i: any) => i.collection === collectionCollabRelationalA2O);
			const restrictedItem = createItems.find((i: any) => i.collection === collectionCollabRelationalM2O);

			expect(allowedItem?.item).toHaveProperty('id', a2oId);
			expect(restrictedItem?.item).toBeUndefined();

			wsAdmin.conn.close();
			wsRestricted.conn.close();
		});
	});
});
