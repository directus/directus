import { CreateCollection, CreateField, DeleteCollection } from '@common/functions';
import vendors, { type Vendor } from '@common/get-dbs-to-test';
import { USER } from '@common/variables';
import type { Item } from '@directus/types';
import { randomUUID, type UUID } from 'node:crypto';
import { expect, it } from 'vitest';
import request from 'supertest';
import { getUrl } from '@common/config';
import { log } from 'node:console';

export type Articles = {
	id?: number | string;
	user_created: UUID;
	// date_created: string;
};

export type Result = {
	isSeeded: boolean;
	editorToken: string | null;
};

export const collection = 'test_case_when_articles';

export const seedDBStructure = () => {
	console.log('seed db structure...');

	it.each(vendors)(
		'%s',
		async (vendor) => {
			try {
				await DeleteCollection(vendor, { collection });

				console.log('deleted collection');

				await CreateCollection(vendor, {
					collection,
					primaryKeyType: 'integer',
				});

				await CreateField(vendor, {
					collection,
					field: 'user_created',
					type: 'uuid',
				});

				// await CreateField(vendor, {
				// 	collection,
				// 	field: 'date_created',
				// 	type: 'timestamp',
				// });

				console.log('setup schema ');

				expect(true).toBeTruthy();
			} catch (error) {
				expect(error).toBeFalsy();
			}
		},
		300000,
	);
};

// Only custom collections, no item creation for system collections
export const seedDBValues = async (): Promise<void> => {
	log('seeding db . . . .. ');

	const promises = vendors.map(async (vendor) => {
		try {
			console.log('starting value seed', vendor);

			await CreateItem(
				vendor,
				collection,
				{
					user_created: randomUUID(),
				},
				USER.ADMIN.TOKEN,
			);

			console.log('first item created');

			await CreateItem(
				vendor,
				collection,
				{
					user_created: randomUUID(),
				},
				USER.ADMIN.TOKEN,
			);

			console.log('second item created');
		} catch (error) {
			throw new Error('Seed Database Values failed');
		}
	});

	await Promise.all(promises);
};

async function CreateItem(vendor: Vendor, collection: string, item: any, token: string): Promise<Item> {
	const response = await request(getUrl(vendor))
		.post(`/items/${collection}`)
		.set('Authorization', `Bearer ${token}`)
		.send(item);

	if (!response.ok) {
		console.log('item creation failed', response.body);
		throw new Error('Could not create item', response.body);
	}

	console.log('item created');

	const response0 = await request(getUrl(vendor))
		.get(`/items/${collection}`)
		.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

	if (!response0.ok) {
		throw new Error('Could not get item');
	}

	console.log('item fetched', response0.body.data);

	return response.body.data;
}
