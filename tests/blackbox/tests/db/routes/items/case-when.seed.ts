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

export const collection = 'testCaseWhenArticles';

export const seedDBStructure = () => {
	console.log('seeding db structure...');

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
export async function seedDBValues(vendor: Vendor, userId: string, userToken: string): Promise<void> {
	log('seeding db ...');

	await CreateItem(
		vendor,
		collection,
		{
			user_created: userId,
		},
		USER.ADMIN.TOKEN,
	);

	console.log('first item created');

	await CreateItem(
		vendor,
		collection,
		{
			user_created: userId,
		},
		userToken,
	);

	console.log('second item created');
}

async function CreateItem(vendor: Vendor, collection: string, item: any, token: string): Promise<Item> {
	const response = await request(getUrl(vendor))
		.post(`/items/${collection}`)
		.set('Authorization', `Bearer ${token}`)
		.send(item);

	if (!response.ok) {
		console.log('item creation failed', response.body);
		console.log(JSON.stringify(response, null, 4));
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
