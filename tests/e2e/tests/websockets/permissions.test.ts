import { randomUUID } from 'node:crypto';
import {
	createDirectus,
	createItem,
	createUser,
	deleteItem,
	readItems,
	realtime,
	rest,
	staticToken,
	updatePolicy,
} from '@directus/sdk';
import { options, port } from '@utils/constants.js';
import { useSnapshot } from '@utils/use-snapshot.js';
import { generateScopedUser } from '@utils/user-scoped.js';
import { expect, test } from 'vitest';
import type { Schema } from './schema.d.ts';

const url = `http://localhost:${port}`;
const api = createDirectus<Schema>(url).with(rest()).with(staticToken('admin'));
const { collections, snapshot } = await useSnapshot<Schema>(api);

type Message = Record<string, any>;

const FORBIDDEN = { type: 'subscribe', status: 'error', error: { code: 'FORBIDDEN' } };
const INITIALIZED = { type: 'subscription', event: 'init' };

function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Open an authenticated realtime connection. The raw message interface is used instead of
 * `client.subscribe()`, as the latter doesn't expose item scoped subscriptions.
 */
async function openSocket(token: string) {
	const client = createDirectus<Schema>(url).with(realtime()).with(staticToken(token));
	const messages: Message[] = [];

	client.onWebSocket('message', (message: Message) => messages.push(message));

	await client.connect();

	/** Wait for the first message matching `match`, and consume it */
	async function waitFor(match: (message: Message) => boolean, timeout = 5000) {
		const start = Date.now();

		while (Date.now() - start < timeout) {
			const index = messages.findIndex(match);
			if (index !== -1) return messages.splice(index, 1)[0]!;
			await sleep(25);
		}

		throw new Error('Timed out waiting for a matching websocket message');
	}

	return {
		client,
		waitFor,
		/** Send a subscribe message and return the response to it */
		subscribe(message: Message & { uid: string }) {
			client.sendMessage({ type: 'subscribe', ...message });

			// Errors are reported without the uid of the subscription that caused them, so they can
			// only be matched on their type
			return waitFor((response) => response['uid'] === message.uid || response['type'] === 'subscribe');
		},
		/** Assert that nothing matching `match` arrives within `window` */
		async expectNothing(match: (message: Message) => boolean, window = 1000) {
			await sleep(window);
			expect(messages.filter(match)).toEqual([]);
		},
	};
}

/** Create a user without a single permission attached to it */
async function createUserWithoutAccess() {
	const token = randomUUID();

	await api.request(
		createUser({
			first_name: 'No',
			last_name: 'Access',
			email: `${token}@websocket-permissions.com`,
			password: 'secret',
			token,
		}),
	);

	return token;
}

if (options.extras?.redis) {
	const plants = collections.plants;

	test('rejects a subscription to a collection without read access', async () => {
		const socket = await openSocket(await createUserWithoutAccess());

		const response = await socket.subscribe({ collection: plants, query: { fields: ['*'] }, uid: 'plants' });

		expect(response).toMatchObject(FORBIDDEN);

		socket.client.disconnect();
	});

	/**
	 * Regression test for GHSA-f3mg-j7hc-hh45: passing an `event` filter used to skip the permission
	 * check entirely, turning the subscription into a live feed of deleted primary keys.
	 */
	test('rejects an event filtered subscription to a collection without read access', async () => {
		const socket = await openSocket(await createUserWithoutAccess());

		for (const event of ['create', 'update', 'delete'] as const) {
			const response = await socket.subscribe({ collection: plants, event, uid: event });

			expect(response, `subscription filtered on "${event}"`).toMatchObject(FORBIDDEN);
		}

		socket.client.disconnect();
	});

	test('rejects an event filtered subscription to a system collection', async () => {
		const socket = await openSocket(await createUserWithoutAccess());

		const response = await socket.subscribe({ collection: 'directus_users', event: 'delete', uid: 'users' });

		expect(response).toMatchObject(FORBIDDEN);

		socket.client.disconnect();
	});

	test('delivers delete events to a user with read access', async () => {
		const { token } = await generateScopedUser(api, snapshot, ['read']);
		const socket = await openSocket(token);

		expect(await socket.subscribe({ collection: plants, event: 'delete', uid: 'deletes' })).toMatchObject(INITIALIZED);

		const item = await api.request(createItem(plants, { name: 'Ficus Elastica' }));
		await api.request(deleteItem(plants, item.id!));

		const message = await socket.waitFor(({ uid, event }) => uid === 'deletes' && event === 'delete');

		expect(message).toEqual({
			type: 'subscription',
			event: 'delete',
			data: [String(item.id)],
			uid: 'deletes',
		});

		socket.client.disconnect();
	});

	test('stops delivering delete events once read access is revoked', async () => {
		const { token, user } = await generateScopedUser(api, snapshot, ['read']);
		const userApi = createDirectus<Schema>(url).with(rest()).with(staticToken(token));
		const socket = await openSocket(token);

		expect(await socket.subscribe({ collection: plants, event: 'delete', uid: 'deletes' })).toMatchObject(INITIALIZED);

		const first = await api.request(createItem(plants, { name: 'Alocasia Frydek' }));
		await api.request(deleteItem(plants, first.id!));

		await socket.waitFor(({ uid, event }) => uid === 'deletes' && event === 'delete');

		// Revoke the access the subscription was registered with
		const [access] = user.policies as { policy: string }[];
		await api.request(updatePolicy(access!.policy, { permissions: [] }));

		// Wait for the permission cache to catch up before relying on the revocation
		await expect
			.poll(
				async () => {
					try {
						await userApi.request(readItems(plants));
						return false;
					} catch {
						return true;
					}
				},
				{ timeout: 5000, interval: 100 },
			)
			.toBe(true);

		const second = await api.request(createItem(plants, { name: 'Monstera Adansonii' }));
		await api.request(deleteItem(plants, second.id!));

		// The subscription itself is still registered, but must no longer receive anything
		await socket.expectNothing(({ uid }) => uid === 'deletes');

		socket.client.disconnect();
	});

	test('rejects an item scoped subscription when the item is not readable', async () => {
		const visible = await api.request(createItem(plants, { name: 'Visible' }));
		const hidden = await api.request(createItem(plants, { name: 'Hidden' }));

		const { token } = await generateScopedUser(api, snapshot, ['read'], (permission) =>
			permission.collection === plants ? { ...permission, permissions: { name: { _eq: 'Visible' } } } : permission,
		);

		const socket = await openSocket(token);

		expect(
			await socket.subscribe({ collection: plants, item: visible.id, event: 'delete', uid: 'visible' }),
		).toMatchObject(INITIALIZED);

		expect(
			await socket.subscribe({ collection: plants, item: hidden.id, event: 'delete', uid: 'hidden' }),
		).toMatchObject(FORBIDDEN);

		socket.client.disconnect();
	});
}
