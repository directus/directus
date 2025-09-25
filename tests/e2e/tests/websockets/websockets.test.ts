import { createDirectus, createItem, deleteItem, realtime, rest, sleep, staticToken, updateItem } from '@directus/sdk';
import { port } from '@utils/constants.js';
import { useOptions } from '@utils/useOptions.js';
import { useSnapshot } from '@utils/useSnapshot.js';
import { expect, test } from 'vitest';
import type { Schema } from './schema.d.ts';
import { inspect } from 'node:util';

const api = createDirectus<Schema>(`http://localhost:${port}`).with(realtime()).with(rest()).with(staticToken('admin'));
await api.connect();

const { collections } = await useSnapshot<Schema>(api);
const options = useOptions();

if (options.extras?.redis) {
	test('subscribing to websockets', async () => {
		const { subscription, unsubscribe } = await api.subscribe(collections.plants);

		const created = await api.request(
			createItem(collections.plants, {
				name: 'Alocasia Frydek',
			}),
		);

		api.request(
			updateItem(collections.plants, created.id!, {
				name: 'Monstera Adansonii',
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

		api.request(deleteItem(collections.plants, created.id!));

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

		const firstResult = subscription.next();

		await sleep(1000);

		expect(inspect(firstResult)).includes('pending');

		await api.request(
			updateItem(collections.plants, created.id!, {
				name: 'item_abc_123',
			}),
		);

		expect(await firstResult).toMatchObject({
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

		await api.request(
			updateItem(collections.plants, created.id!, {
				name: 'item_123',
			}),
		);

		const secondResult = subscription.next();

		await sleep(1000);

		expect(inspect(secondResult)).includes('pending');

		unsubscribe();

		const finalResult = await subscription.next();

		expect(finalResult).toEqual({
			done: true,
			value: undefined,
		});
	});
}
