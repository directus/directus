import { randomUUID } from 'node:crypto';
import { getUrl } from '@common/config';
import vendors from '@common/get-dbs-to-test';
import { createWebSocketConn, waitForMatchingMessage } from '@common/transport';
import type { WebSocketCollabResponse } from '@common/types';
import { USER } from '@common/variables';
import { sleep } from '@utils/sleep';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';
import { collectionCollabCore, seedDBStructure } from './core.seed';

describe('Collaborative Editing: Core', () => {
	beforeAll(async () => {
		await seedDBStructure();
	});

	describe('Join and leave a room', () => {
		it.each(vendors)('%s', async (vendor) => {
			const TEST_URL = getUrl(vendor);
			const itemId = randomUUID();

			// Setup
			await request(TEST_URL)
				.post(`/items/${collectionCollabCore}`)
				.send({ id: itemId, title: 'Test Item' })
				.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

			const ws = createWebSocketConn(TEST_URL, {
				auth: { access_token: USER.ADMIN.TOKEN },
			});

			// Action
			await ws.sendMessage({
				type: 'collab',
				action: 'join',
				collection: collectionCollabCore,
				item: itemId,
				version: null,
			});

			// Assert
			const initMsg = await waitForMatchingMessage<WebSocketCollabResponse>(
				ws,
				(msg) => msg.type === 'collab' && msg.action === 'init',
			);

			expect(initMsg).toMatchObject({
				type: 'collab',
				action: 'init',
				collection: collectionCollabCore,
				item: itemId,
			});

			// Action
			await ws.sendMessage({
				type: 'collab',
				action: 'leave',
				room: initMsg.room,
			});

			ws.conn.close();
		});
	});

	describe('Join with invalid version returns error', () => {
		it.each(vendors)('%s', async (vendor) => {
			const TEST_URL = getUrl(vendor);
			const itemId = randomUUID();

			// Setup
			await request(TEST_URL)
				.post(`/items/${collectionCollabCore}`)
				.send({ id: itemId, title: 'V1' })
				.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

			const ws = createWebSocketConn(TEST_URL, {
				auth: { access_token: USER.ADMIN.TOKEN },
			});

			// Action
			await ws.sendMessage({
				type: 'collab',
				action: 'join',
				collection: collectionCollabCore,
				item: itemId,
				version: 'invalid-version-string',
			});

			// Assert
			const errorMsg = await waitForMatchingMessage(ws, (msg) => msg.action === 'error');

			expect(errorMsg).toMatchObject({
				action: 'error',
				code: 'FORBIDDEN',
			});

			ws.conn.close();
		});

		describe('Join with non-existent collection returns error', () => {
			it.each(vendors)('%s', async (vendor) => {
				const TEST_URL = getUrl(vendor);

				// Setup
				const ws = createWebSocketConn(TEST_URL, {
					auth: { access_token: USER.ADMIN.TOKEN },
				});

				// Action
				await ws.sendMessage({
					type: 'collab',
					action: 'join',
					collection: 'non_existent_collection',
					item: randomUUID(),
					version: null,
				});

				// Assert
				const errorMsg = await waitForMatchingMessage(ws, (msg) => msg['action'] === 'error');

				expect(errorMsg).toMatchObject({
					action: 'error',
					code: 'FORBIDDEN',
				});

				ws.conn.close();
			});
		});
	});

	describe('Client can rejoin after disconnect and receive latest state', () => {
		it.each(vendors)('%s', async (vendor) => {
			const TEST_URL = getUrl(vendor);
			const itemId = randomUUID();

			// Setup
			await request(TEST_URL)
				.post(`/items/${collectionCollabCore}`)
				.send({ id: itemId, title: 'V1' })
				.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

			const ws1 = createWebSocketConn(TEST_URL, { auth: { access_token: USER.ADMIN.TOKEN } });
			const ws2 = createWebSocketConn(TEST_URL, { auth: { access_token: USER.ADMIN.TOKEN } });

			// Action
			await ws1.sendMessage({
				type: 'collab',
				action: 'join',
				collection: collectionCollabCore,
				item: itemId,
				version: null,
			});

			const init1 = await waitForMatchingMessage(ws1, (msg) => msg.type === 'collab' && msg.action === 'init');
			const room = init1['room'];

			await ws2.sendMessage({
				type: 'collab',
				action: 'join',
				collection: collectionCollabCore,
				item: itemId,
				version: null,
			});

			await waitForMatchingMessage(ws2, (msg) => msg.type === 'collab' && msg.action === 'init');
			await waitForMatchingMessage(ws1, (msg) => msg.type === 'collab' && msg.action === 'join');

			// Action
			ws1.conn.close();

			await sleep(200);

			while (ws2.getUnreadMessageCount() > 0) {
				await ws2.getMessages(1); // Drain LEAVE
			}

			await ws2.sendMessage({ type: 'collab', action: 'focus', room, field: 'title' });

			await ws2.sendMessage({
				type: 'collab',
				action: 'update',
				room,
				field: 'title',
				changes: 'V2',
			});

			await sleep(200);

			// Action
			const wsRec = createWebSocketConn(TEST_URL, { auth: { access_token: USER.ADMIN.TOKEN } });

			await wsRec.sendMessage({
				type: 'collab',
				action: 'join',
				collection: collectionCollabCore,
				item: itemId,
				version: null,
			});

			// Assert
			const init2Msg = await waitForMatchingMessage(wsRec, (msg) => msg.type === 'collab' && msg.action === 'init');

			expect(init2Msg).toBeDefined();
			expect(init2Msg?.changes).toMatchObject({ title: 'V2' });

			wsRec.conn.close();
			ws2.conn.close();
		});
	});

	describe('Disconnect Cleanup', () => {
		it.each(vendors)('%s', async (vendor) => {
			const TEST_URL = getUrl(vendor);
			const itemId = randomUUID();

			// Setup
			await request(TEST_URL)
				.post(`/items/${collectionCollabCore}`)
				.send({ id: itemId, title: 'Disconnect Test' })
				.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

			const ws1 = createWebSocketConn(TEST_URL, { auth: { access_token: USER.ADMIN.TOKEN } });
			const ws2 = createWebSocketConn(TEST_URL, { auth: { access_token: USER.ADMIN.TOKEN } });

			await ws1.sendMessage({
				type: 'collab',
				action: 'join',
				collection: collectionCollabCore,
				item: itemId,
				version: null,
			});

			const init1 = await waitForMatchingMessage(ws1, (msg) => msg.type === 'collab' && msg.action === 'init');
			const room = init1['room'];

			await ws2.sendMessage({
				type: 'collab',
				action: 'join',
				collection: collectionCollabCore,
				item: itemId,
				version: null,
			});

			await waitForMatchingMessage(ws2, (msg) => msg.type === 'collab' && msg.action === 'init');

			const ws2JoinMsg = await waitForMatchingMessage(ws1, (msg) => msg.type === 'collab' && msg.action === 'join');

			const ws2ConnId = ws2JoinMsg.connection;

			// Action
			ws2.conn.close();

			// Assert
			const leaveMsg = await waitForMatchingMessage(
				ws1,
				(msg) => msg.type === 'collab' && msg.action === 'leave' && msg.connection === ws2ConnId,
			);

			expect(leaveMsg).toMatchObject({
				type: 'collab',
				action: 'leave',
				room,
				connection: ws2ConnId,
			});

			ws1.conn.close();
		});
	});

	describe('Focus Propagation', () => {
		it.each(vendors)('%s', async (vendor) => {
			const TEST_URL = getUrl(vendor);
			const itemId = randomUUID();

			// Setup
			await request(TEST_URL)
				.post(`/items/${collectionCollabCore}`)
				.send({ id: itemId, title: 'Focus Test' })
				.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

			const ws1 = createWebSocketConn(TEST_URL, { auth: { access_token: USER.ADMIN.TOKEN } });
			const ws2 = createWebSocketConn(TEST_URL, { auth: { access_token: USER.ADMIN.TOKEN } });

			await ws1.sendMessage({
				type: 'collab',
				action: 'join',
				collection: collectionCollabCore,
				item: itemId,
				version: null,
			});

			const init1 = await waitForMatchingMessage(ws1, (msg) => msg.type === 'collab' && msg.action === 'init');
			const room = init1['room'];

			await ws2.sendMessage({
				type: 'collab',
				action: 'join',
				collection: collectionCollabCore,
				item: itemId,
				version: null,
			});

			await waitForMatchingMessage(ws2, (msg) => msg.type === 'collab' && msg.action === 'init');
			await waitForMatchingMessage(ws1, (msg) => msg.type === 'collab' && msg.action === 'join');

			// Action
			await ws1.sendMessage({
				type: 'collab',
				action: 'focus',
				room,
				field: 'title',
			});

			// Assert
			const focusMsg = await waitForMatchingMessage(
				ws2,
				(msg) => msg.type === 'collab' && msg.action === 'focus' && msg.field === 'title',
			);

			expect(focusMsg).toMatchObject({
				type: 'collab',
				action: 'focus',
				room,
				field: 'title',
				connection: init1.connection,
			});

			ws1.conn.close();
			ws2.conn.close();
		});
	});

	describe('Focus Cleanup', () => {
		it.each(vendors)('%s', async (vendor) => {
			const TEST_URL = getUrl(vendor);
			const itemId = randomUUID();

			// Setup
			await request(TEST_URL)
				.post(`/items/${collectionCollabCore}`)
				.send({ id: itemId, title: 'Cleanup Focus Test' })
				.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

			const ws1 = createWebSocketConn(TEST_URL, { auth: { access_token: USER.ADMIN.TOKEN } });
			const ws2 = createWebSocketConn(TEST_URL, { auth: { access_token: USER.ADMIN.TOKEN } });

			// Action
			await ws1.sendMessage({
				type: 'collab',
				action: 'join',
				collection: collectionCollabCore,
				item: itemId,
				version: null,
			});

			const init1 = await waitForMatchingMessage(ws1, (msg) => msg.type === 'collab' && msg.action === 'init');
			const room = init1['room'];

			await ws1.sendMessage({
				type: 'collab',
				action: 'focus',
				room,
				field: 'title',
			});

			await ws1.sendMessage({
				type: 'collab',
				action: 'leave',
				room,
			});

			await sleep(200);

			await ws2.sendMessage({
				type: 'collab',
				action: 'join',
				collection: collectionCollabCore,
				item: itemId,
				version: null,
			});

			// Assert
			const init2 = await waitForMatchingMessage(ws2, (msg) => msg.type === 'collab' && msg.action === 'init');

			expect(init2).toMatchObject({
				type: 'collab',
				action: 'init',
				focuses: {}, // Verify that the focus from ws1 is gone
			});

			// Action
			await ws2.sendMessage({
				type: 'collab',
				action: 'focus',
				room,
				field: 'title',
			});

			// Assert
			await sleep(200);

			const unreadCount = ws2.getUnreadMessageCount();

			if (unreadCount > 0) {
				const msgs = await ws2.getMessages(unreadCount);
				const error = msgs?.find((msg) => msg.status === 'error');
				expect(error).toBeUndefined();
			}

			ws1.conn.close();
			ws2.conn.close();
		});
	});

	describe('Atomic Focus Acquisition', () => {
		it.each(vendors)('%s', async (vendor) => {
			const TEST_URL = getUrl(vendor);
			const itemId = randomUUID();

			// Setup
			await request(TEST_URL)
				.post(`/items/${collectionCollabCore}`)
				.send({ id: itemId, title: 'Race Test' })
				.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

			const ws1 = createWebSocketConn(TEST_URL, { auth: { access_token: USER.ADMIN.TOKEN } });
			const ws2 = createWebSocketConn(TEST_URL, { auth: { access_token: USER.ADMIN.TOKEN } });

			await ws1.sendMessage({
				type: 'collab',
				action: 'join',
				collection: collectionCollabCore,
				item: itemId,
				version: null,
			});

			const init1 = await waitForMatchingMessage(ws1, (msg) => msg.type === 'collab' && msg.action === 'init');
			const room = init1['room'];

			await ws2.sendMessage({
				type: 'collab',
				action: 'join',
				collection: collectionCollabCore,
				item: itemId,
				version: null,
			});

			await waitForMatchingMessage(ws2, (msg) => msg.type === 'collab' && msg.action === 'init');
			await waitForMatchingMessage(ws1, (msg) => msg.type === 'collab' && msg.action === 'join');

			// Action
			const focusPromise1 = ws1.sendMessage({
				type: 'collab',
				action: 'focus',
				room,
				field: 'title',
			});

			const focusPromise2 = ws2.sendMessage({
				type: 'collab',
				action: 'focus',
				room,
				field: 'title',
			});

			await Promise.all([focusPromise1, focusPromise2]);

			await sleep(500);

			// Assert
			const ws1Msgs = (await ws1.getMessages(ws1.getUnreadMessageCount())) || [];
			const ws2Msgs = (await ws2.getMessages(ws2.getUnreadMessageCount())) || [];

			// Exactly one client should have received an error
			const ws1Errors = ws1Msgs.filter((msg) => msg.action === 'error');
			const ws2Errors = ws2Msgs.filter((msg) => msg.action === 'error');

			const totalErrors = ws1Errors.length + ws2Errors.length;
			expect(totalErrors).toBe(1);

			const errorMsg = [...ws1Errors, ...ws2Errors][0] as WebSocketCollabResponse;
			expect(errorMsg?.code).toBe('FORBIDDEN');
			expect(errorMsg?.message).toContain('already focused');

			ws1.conn.close();
			ws2.conn.close();
		});
	});

	describe('Focus release to allow another client to acquire', () => {
		it.each(vendors)('%s', async (vendor) => {
			const TEST_URL = getUrl(vendor);
			const itemId = randomUUID();

			// Setup
			await request(TEST_URL)
				.post(`/items/${collectionCollabCore}`)
				.send({ id: itemId, title: 'Release Test' })
				.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

			const ws1 = createWebSocketConn(TEST_URL, { auth: { access_token: USER.ADMIN.TOKEN } });
			const ws2 = createWebSocketConn(TEST_URL, { auth: { access_token: USER.ADMIN.TOKEN } });

			// Action
			await ws1.sendMessage({
				type: 'collab',
				action: 'join',
				collection: collectionCollabCore,
				item: itemId,
				version: null,
			});

			const init1 = await waitForMatchingMessage(ws1, (msg) => msg.type === 'collab' && msg.action === 'init');
			const room = init1['room'];

			await ws2.sendMessage({
				type: 'collab',
				action: 'join',
				collection: collectionCollabCore,
				item: itemId,
				version: null,
			});

			await waitForMatchingMessage(ws2, (msg) => msg.type === 'collab' && msg.action === 'init');
			await waitForMatchingMessage(ws1, (msg) => msg.type === 'collab' && msg.action === 'join');

			await ws1.sendMessage({
				type: 'collab',
				action: 'focus',
				room,
				field: 'title',
			});

			await waitForMatchingMessage(
				ws2,
				(msg) => msg.type === 'collab' && msg.action === 'focus' && msg.field === 'title',
			);

			await ws1.sendMessage({
				type: 'collab',
				action: 'focus',
				room,
				field: null,
			});

			await sleep(200);

			// Drain any pending messages
			const ws2UnreadCount = ws2.getUnreadMessageCount();

			if (ws2UnreadCount > 0) {
				await ws2.getMessages(ws2UnreadCount);
			}

			// ws2 should now be able to focus
			await ws2.sendMessage({
				type: 'collab',
				action: 'focus',
				room,
				field: 'title',
			});

			// Assert
			const focusNotification = await waitForMatchingMessage(
				ws1,
				(msg) => msg.action === 'focus' && msg.field === 'title',
			);

			expect(focusNotification).toBeDefined();

			ws1.conn.close();
			ws2.conn.close();
		});
	});

	describe('Update Propagation (Intra-instance)', () => {
		it.each(vendors)('%s', async (vendor) => {
			const TEST_URL = getUrl(vendor);
			const itemId = randomUUID();

			// Setup
			await request(TEST_URL)
				.post(`/items/${collectionCollabCore}`)
				.send({ id: itemId, title: 'Intra Instance Test' })
				.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

			const ws1 = createWebSocketConn(TEST_URL, { auth: { access_token: USER.ADMIN.TOKEN } });
			const ws2 = createWebSocketConn(TEST_URL, { auth: { access_token: USER.ADMIN.TOKEN } });

			await ws1.sendMessage({
				type: 'collab',
				action: 'join',
				collection: collectionCollabCore,
				item: itemId,
				version: null,
			});

			const init1 = await waitForMatchingMessage(ws1, (msg) => msg.type === 'collab' && msg.action === 'init');
			const room = init1['room'];

			await ws2.sendMessage({
				type: 'collab',
				action: 'join',
				collection: collectionCollabCore,
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

			await ws1.sendMessage({ type: 'collab', action: 'update', room, field: 'title', changes: 'Updated Title' });

			const updateMsg = await waitForMatchingMessage(
				ws2,
				(msg) => msg.type === 'collab' && msg.action === 'update' && msg.field === 'title',
			);

			// Assert
			expect(updateMsg).toMatchObject({
				type: 'collab',
				action: 'update',
				room,
				field: 'title',
				changes: 'Updated Title',
			});

			ws1.conn.close();
			ws2.conn.close();
		});
	});

	describe('Delete Propagation', () => {
		it.each(vendors)('%s', async (vendor) => {
			const TEST_URL = getUrl(vendor);
			const itemId = randomUUID();

			// Setup
			await request(TEST_URL)
				.post(`/items/${collectionCollabCore}`)
				.send({ id: itemId, title: 'Delete Test' })
				.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

			const ws1 = createWebSocketConn(TEST_URL, { auth: { access_token: USER.ADMIN.TOKEN } });

			await ws1.sendMessage({
				type: 'collab',
				action: 'join',
				collection: collectionCollabCore,
				item: itemId,
				version: null,
			});

			const init1 = await ws1.getMessages(1);
			expect(init1![0]).toMatchObject({ type: 'collab', action: 'init' });

			// Action
			await request(TEST_URL)
				.delete(`/items/${collectionCollabCore}/${itemId}`)
				.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`)
				.expect(204);

			// Assert
			const deleteMsg = await ws1.getMessages(1);

			expect(deleteMsg![0]).toMatchObject({
				type: 'collab',
				action: 'delete',
			});

			ws1.conn.close();
		});
	});

	describe('Concurrent Data Merge (Diff Fields)', () => {
		it.each(vendors)('%s', async (vendor) => {
			const TEST_URL = getUrl(vendor);
			const itemId = randomUUID();

			// Setup
			await request(TEST_URL)
				.post(`/items/${collectionCollabCore}`)
				.send({ id: itemId, title: 'Main', notes: 'Main' })
				.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

			const ws1 = createWebSocketConn(TEST_URL, { auth: { access_token: USER.ADMIN.TOKEN } });
			const ws2 = createWebSocketConn(TEST_URL, { auth: { access_token: USER.ADMIN.TOKEN } });

			await ws1.sendMessage({
				type: 'collab',
				action: 'join',
				collection: collectionCollabCore,
				item: itemId,
				version: null,
			});

			const init1 = await ws1.getMessages(1);
			const room = init1![0]!.room;

			await ws2.sendMessage({
				type: 'collab',
				action: 'join',
				collection: collectionCollabCore,
				item: itemId,
				version: null,
			});

			await ws2.getMessages(1); // Drain INIT
			await ws1.getMessages(1); // Drain JOIN

			await ws1.sendMessage({ type: 'collab', action: 'focus', room, field: 'title' });
			await ws2.sendMessage({ type: 'collab', action: 'focus', room, field: 'notes' });

			// Drain Focuses
			await ws1.getMessages(1); // ws2 focus
			await ws2.getMessages(1); // ws1 focus

			// Action
			await Promise.all([
				ws1.sendMessage({ type: 'collab', action: 'update', room, field: 'title', changes: 'Merged Title' }),
				ws2.sendMessage({ type: 'collab', action: 'update', room, field: 'notes', changes: 'Merged Notes' }),
			]);

			// Assert
			const ws1Update = await waitForMatchingMessage(
				ws1,
				(msg) => msg.type === 'collab' && msg.action === 'update' && msg.field === 'notes',
			);

			const ws2Update = await waitForMatchingMessage(
				ws2,
				(msg) => msg.type === 'collab' && msg.action === 'update' && msg.field === 'title',
			);

			expect(ws1Update).toBeDefined();
			expect(ws2Update).toBeDefined();

			const ws3 = createWebSocketConn(TEST_URL, { auth: { access_token: USER.ADMIN.TOKEN } });

			await ws3.sendMessage({
				type: 'collab',
				action: 'join',
				collection: collectionCollabCore,
				item: itemId,
				version: null,
			});

			const init3 = await ws3.getMessages(1);
			const roomState = init3![0];

			expect(roomState).toMatchObject({
				type: 'collab',
				action: 'init',
				changes: {
					title: 'Merged Title',
					notes: 'Merged Notes',
				},
			});

			ws1.conn.close();
			ws2.conn.close();
			ws3.conn.close();
		});
	});

	describe('Concurrent Room Isolation', () => {
		it.each(vendors)('%s', async (vendor) => {
			const TEST_URL = getUrl(vendor);
			const item1Id = randomUUID();
			const item2Id = randomUUID();

			// Setup
			await request(TEST_URL)
				.post(`/items/${collectionCollabCore}`)
				.send({ id: item1Id, title: 'Item 1' })
				.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

			await request(TEST_URL)
				.post(`/items/${collectionCollabCore}`)
				.send({ id: item2Id, title: 'Item 2' })
				.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

			const ws1 = createWebSocketConn(TEST_URL, { auth: { access_token: USER.ADMIN.TOKEN } });
			const ws2 = createWebSocketConn(TEST_URL, { auth: { access_token: USER.ADMIN.TOKEN } });

			// Action
			await ws1.sendMessage({
				type: 'collab',
				action: 'join',
				collection: collectionCollabCore,
				item: item1Id,
				version: null,
			});

			const init1 = await waitForMatchingMessage(ws1, (msg) => msg.type === 'collab' && msg.action === 'init');
			const room1 = init1.room;

			await ws2.sendMessage({
				type: 'collab',
				action: 'join',
				collection: collectionCollabCore,
				item: item2Id,
				version: null,
			});

			const init2 = await waitForMatchingMessage(ws2, (msg) => msg.type === 'collab' && msg.action === 'init');
			const room2 = init2.room;

			expect(room1).not.toBe(room2);

			const ws1Recorder = createWebSocketConn(TEST_URL, { auth: { access_token: USER.ADMIN.TOKEN } });
			const ws2Recorder = createWebSocketConn(TEST_URL, { auth: { access_token: USER.ADMIN.TOKEN } });

			await Promise.all([
				ws1Recorder.sendMessage({
					type: 'collab',
					action: 'join',
					collection: collectionCollabCore,
					item: item1Id,
					version: null,
				}),
				ws2Recorder.sendMessage({
					type: 'collab',
					action: 'join',
					collection: collectionCollabCore,
					item: item2Id,
					version: null,
				}),
			]);

			await Promise.all([
				waitForMatchingMessage(ws1Recorder, (msg) => msg.type === 'collab' && msg.action === 'init'),
				waitForMatchingMessage(ws2Recorder, (msg) => msg.type === 'collab' && msg.action === 'init'),
			]);

			await ws1.sendMessage({ type: 'collab', action: 'focus', room: room1, field: 'title' });
			await ws2.sendMessage({ type: 'collab', action: 'focus', room: room2, field: 'title' });

			// Action
			await Promise.all([
				ws1.sendMessage({ type: 'collab', action: 'update', room: room1, field: 'title', changes: 'Update 1' }),
				ws2.sendMessage({ type: 'collab', action: 'update', room: room2, field: 'title', changes: 'Update 2' }),
			]);

			await Promise.all([
				waitForMatchingMessage(ws1Recorder, (msg) => msg.action === 'update' && msg.changes === 'Update 1'),
				waitForMatchingMessage(ws2Recorder, (msg) => msg.action === 'update' && msg.changes === 'Update 2'),
			]);

			// Assert
			const ws3 = createWebSocketConn(TEST_URL, { auth: { access_token: USER.ADMIN.TOKEN } });

			await ws3.sendMessage({
				type: 'collab',
				action: 'join',
				collection: collectionCollabCore,
				item: item1Id,
				version: null,
			});

			const init3 = await waitForMatchingMessage(ws3, (msg) => msg.type === 'collab' && msg.action === 'init');

			expect(init3).toMatchObject({
				changes: { title: 'Update 1' },
			});

			const ws4 = createWebSocketConn(TEST_URL, { auth: { access_token: USER.ADMIN.TOKEN } });

			await ws4.sendMessage({
				type: 'collab',
				action: 'join',
				collection: collectionCollabCore,
				item: item2Id,
				version: null,
			});

			const init4 = await waitForMatchingMessage(ws4, (msg) => msg.type === 'collab' && msg.action === 'init');

			expect(init4).toMatchObject({
				changes: { title: 'Update 2' },
			});

			ws1.conn.close();
			ws2.conn.close();
			ws3.conn.close();
			ws4.conn.close();
		});
	});

	describe('Last Write Wins (Same Field)', () => {
		it.each(vendors)('%s', async (vendor) => {
			const TEST_URL = getUrl(vendor);
			const itemId = randomUUID();

			// Setup
			await request(TEST_URL)
				.post(`/items/${collectionCollabCore}`)
				.send({ id: itemId, title: 'Original' })
				.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

			const ws1 = createWebSocketConn(TEST_URL, { auth: { access_token: USER.ADMIN.TOKEN } });
			const ws2 = createWebSocketConn(TEST_URL, { auth: { access_token: USER.ADMIN.TOKEN } });

			await ws1.sendMessage({
				type: 'collab',
				action: 'join',
				collection: collectionCollabCore,
				item: itemId,
				version: null,
			});

			const init1 = await waitForMatchingMessage(ws1, (msg) => msg.type === 'collab' && msg.action === 'init');
			const room = init1['room'];

			await ws2.sendMessage({
				type: 'collab',
				action: 'join',
				collection: collectionCollabCore,
				item: itemId,
				version: null,
			});

			await waitForMatchingMessage(ws2, (msg) => msg.type === 'collab' && msg.action === 'init');
			await waitForMatchingMessage(ws1, (msg) => msg.type === 'collab' && msg.action === 'join');

			await ws1.sendMessage({ type: 'collab', action: 'focus', room, field: 'title' });
			await waitForMatchingMessage(ws2, (msg) => msg.action === 'focus' && msg.field === 'title');

			await ws1.sendMessage({ type: 'collab', action: 'update', room, field: 'title', changes: 'Val A' });
			await waitForMatchingMessage(ws2, (msg) => msg.action === 'update' && msg.changes === 'Val A');

			await ws1.sendMessage({ type: 'collab', action: 'focus', room, field: null }); // Release
			await waitForMatchingMessage(ws2, (msg) => msg.action === 'focus' && msg.field === null);

			await ws2.sendMessage({ type: 'collab', action: 'focus', room, field: 'title' });
			await ws2.sendMessage({ type: 'collab', action: 'update', room, field: 'title', changes: 'Val B' });
			await waitForMatchingMessage(ws1, (msg) => msg.action === 'update' && msg.changes === 'Val B');

			// Assert
			const ws3 = createWebSocketConn(TEST_URL, { auth: { access_token: USER.ADMIN.TOKEN } });

			await ws3.sendMessage({
				type: 'collab',
				action: 'join',
				collection: collectionCollabCore,
				item: itemId,
				version: null,
			});

			const init3 = await waitForMatchingMessage(ws3, (msg) => msg.type === 'collab' && msg.action === 'init');

			expect(init3).toMatchObject({
				changes: { title: 'Val B' },
			});

			ws1.conn.close();
			ws2.conn.close();
			ws3.conn.close();
		});
	});

	describe('Versioned Item Propagation', () => {
		it.each(vendors)('%s', async (vendor) => {
			const TEST_URL = getUrl(vendor);
			const itemId = randomUUID();
			const versionId = randomUUID();

			// Setup
			await request(TEST_URL)
				.post(`/items/${collectionCollabCore}`)
				.send({ id: itemId, title: 'Original' })
				.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

			const versionRes = await request(TEST_URL)
				.post('/versions')
				.send({
					key: versionId,
					collection: collectionCollabCore,
					item: itemId,
				})
				.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

			const versionPk = versionRes.body.data.id;

			const ws1 = createWebSocketConn(TEST_URL, { auth: { access_token: USER.ADMIN.TOKEN } });
			const ws2 = createWebSocketConn(TEST_URL, { auth: { access_token: USER.ADMIN.TOKEN } });

			// Action
			await ws1.sendMessage({
				type: 'collab',
				action: 'join',
				collection: collectionCollabCore,
				item: itemId,
				version: versionPk,
			});

			const init1 = await waitForMatchingMessage<WebSocketCollabResponse>(
				ws1,
				(msg) => msg.type === 'collab' && msg.action === 'init',
			);

			const room = init1['room'];

			await ws2.sendMessage({
				type: 'collab',
				action: 'join',
				collection: collectionCollabCore,
				item: itemId,
				version: versionPk,
			});

			await waitForMatchingMessage(ws2, (msg) => msg.type === 'collab' && msg.action === 'init');
			await waitForMatchingMessage(ws1, (msg) => msg.type === 'collab' && msg.action === 'join');

			await ws1.sendMessage({ type: 'collab', action: 'focus', room, field: 'title' });
			await ws1.sendMessage({ type: 'collab', action: 'update', room, field: 'title', changes: 'Version Update' });

			await waitForMatchingMessage(ws2, (msg) => msg.action === 'update' && msg.changes === 'Version Update');

			await request(TEST_URL)
				.post(`/versions/${versionPk}/save`)
				.send({ title: 'Version Update' })
				.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`)
				.expect(200);

			// Assert
			const saveMsg1 = await waitForMatchingMessage<WebSocketCollabResponse>(ws1, (msg) => msg.action === 'save');
			const saveMsg2 = await waitForMatchingMessage<WebSocketCollabResponse>(ws2, (msg) => msg.action === 'save');

			expect(saveMsg1).toBeDefined();
			expect(saveMsg2).toBeDefined();

			ws1.conn.close();
			ws2.conn.close();
		});
	});
});
