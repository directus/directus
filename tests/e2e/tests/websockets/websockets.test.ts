import { createDirectus, createItem, deleteItem, realtime, rest, staticToken, updateItem } from '@directus/sdk';
import { join } from 'path';
import { expect, test } from 'vitest';
import { useSnapshot } from '../../utils/useSnapshot';
import { Schema } from './schema';
import { useOptions } from '../../utils/useOptions';

const api = createDirectus<Schema>(`http://localhost:${process.env['PORT']}`)
	.with(realtime({ debug: true }))
	.with(rest())
	.with(staticToken('admin'));

const { collections } = await useSnapshot<Schema>(api, join(import.meta.dirname, 'snapshot.json'));
const options = useOptions();

if (options.extras?.redis) {
	test('subscribing to websockets', async () => {
		await api.connect();
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

		expect(thirdResult).toMatchObject({
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

		expect(finalResult).toMatchObject({
			value: undefined,
			done: true,
		});
	});
}
