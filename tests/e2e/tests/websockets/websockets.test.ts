import { createDirectus, createItem, deleteItem, realtime, rest, staticToken, updateItem } from '@directus/sdk';
import { options, port } from '@utils/constants.js';
import { useSnapshot } from '@utils/use-snapshot.js';
import { expect, test } from 'vitest';
import type { Schema } from './schema.d.ts';

const api = createDirectus<Schema>(`http://localhost:${port}`).with(realtime()).with(rest()).with(staticToken('admin'));
await api.connect();

const { collections } = await useSnapshot<Schema>(api);

if (options.extras?.redis) {
	test('subscribing to websockets', async () => {
		const { subscription, unsubscribe } = await api.subscribe(collections.plants);

		const created = await api.request(
			createItem(collections.plants, {
				name: 'Alocasia Frydek',
			}),
		);

		const initialResult = await subscription.next();

		expect(initialResult).toMatchObject({
			done: false,
			value: {
				uid: '1',
				type: 'subscription',
				event: 'create',
				data: [
					{
						name: 'Alocasia Frydek',
					},
				],
			},
		});

		await api.request(
			updateItem(collections.plants, created.id!, {
				name: 'Monstera Adansonii',
			}),
		);

		const secondResult = await subscription.next();

		expect(secondResult).toMatchObject({
			done: false,
			value: {
				uid: '1',
				type: 'subscription',
				event: 'update',
				data: [
					{
						name: 'Monstera Adansonii',
					},
				],
			},
		});

		await api.request(deleteItem(collections.plants, created.id!));

		const thirdResult = await subscription.next();

		expect(thirdResult).toEqual({
			done: false,
			value: {
				uid: '1',
				type: 'subscription',
				event: 'delete',
				data: [expect.any(String)],
			},
		});

		unsubscribe();

		api.request(
			createItem(collections.plants, {
				name: 'Monstera Minima',
			}),
		);

		const finalResult = await subscription.next();

		expect(finalResult).toEqual({
			value: undefined,
			done: true,
		});
	});

	test('unsubscribing from websockets', async () => {
		const { subscription, unsubscribe } = await api.subscribe(collections.plants);

		await api.request(
			createItem(collections.plants, {
				name: 'Alocasia Frydek',
			}),
		);

		unsubscribe();

		const initialResult = await subscription.next();

		expect(initialResult).toEqual({
			done: true,
			value: undefined,
		});
	});

	test('event filtering', async () => {
		const { subscription, unsubscribe } = await api.subscribe(collections.plants, {
			event: 'update',
			query: {
				filter: {
					name: {
						_contains: 'abc',
					},
				},
			},
		});

		const created = await api.request(
			createItem(collections.plants, {
				name: 'Alocasia Frydek',
			}),
		);

		await api.request(
			updateItem(collections.plants, created.id!, {
				name: 'item_abc_123',
			}),
		);

		const firstResult = await subscription.next();

		expect(firstResult).toMatchObject({
			done: false,
			value: {
				data: [
					{
						id: created.id,
						name: 'item_abc_123',
					},
				],
			},
		});

		const secondResult = new Promise((resolve, reject) => {
			const timeout = setTimeout(() => {
				resolve(true);
			}, 1000);

			subscription.next().then(() => {
				clearTimeout(timeout);
				reject();
			});
		});

		await api.request(
			updateItem(collections.plants, created.id!, {
				name: 'item_123',
			}),
		);

		await expect(secondResult, 'subscription should not return another item').resolves.toBeTruthy();

		unsubscribe();

		const finalResult = await subscription.next();

		expect(finalResult).toEqual({
			done: true,
			value: undefined,
		});
	});
}
