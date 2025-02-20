import { DeleteCollection } from '@common/functions';
import vendors, { type Vendor } from '@common/get-dbs-to-test';
import { USER } from '@common/variables';
import type { Item } from '@directus/types';
import { type UUID } from 'node:crypto';
import { expect, it } from 'vitest';
import request from 'supertest';
import { getUrl } from '@common/config';

export type Articles = {
	id?: number | string;
	user_created: UUID;
	// date_created: string;
};

export type Result = {
	isSeeded: boolean;
	editorToken: string | null;
};

export const collection = 'articles_case_when';

export const seedDBStructure = () => {
	it.each(vendors)(
		'%s',
		async (vendor) => {
			try {
				await DeleteCollection(vendor, { collection });

				const collectionResponse = await request(getUrl(vendor))
					.post(`/collections`)
					.set('Authorization', `Bearer ${USER.TESTS_FLOW.TOKEN}`)
					.send({
						collection: 'articles_case_when',
						fields: [
							{
								field: 'id',
								type: 'integer',
								meta: {
									hidden: true,
									interface: 'input',
									readonly: true,
								},
								schema: {
									is_primary_key: true,
									has_auto_increment: true,
								},
							},
							{
								field: 'user_created',
								type: 'uuid',
								meta: {
									special: ['user-created'],
									interface: 'select-dropdown-m2o',
									options: {
										template: '{{avatar}} {{first_name}} {{last_name}}',
									},
									display: 'user',
									readonly: true,
									hidden: true,
									width: 'half',
								},
								schema: {},
							},
							{
								field: 'date_created',
								type: 'timestamp',
								meta: {
									special: ['date-created'],
									interface: 'datetime',
									readonly: true,
									hidden: true,
									width: 'half',
									display: 'datetime',
									display_options: {
										relative: true,
									},
								},
								schema: {},
							},
						],
						schema: {},
						meta: {
							singleton: false,
						},
					});

				if (!collectionResponse.ok) {
					throw new Error('Could not create collection', collectionResponse.body);
				}

				const relationsResponse = await request(getUrl(vendor))
					.post(`/relations`)
					.set('Authorization', `Bearer ${USER.TESTS_FLOW.TOKEN}`)
					.send({
						collection: 'articles_case_when',
						field: 'user_created',
						related_collection: 'directus_users',
						schema: {},
					});

				if (!relationsResponse.ok) {
					throw new Error('Could not create relation', relationsResponse.body);
				}

				expect(true).toBeTruthy();
			} catch (error) {
				expect(error).toBeFalsy();
			}
		},
		300000,
	);
};

// Only custom collections, no item creation for system collections
export async function seedDBValues(vendor: Vendor, userToken: string): Promise<void> {
	await CreateItem(vendor, collection, userToken);
	await CreateItem(vendor, collection, userToken);
}

async function CreateItem(vendor: Vendor, collection: string, token: string): Promise<Item> {
	const response = await request(getUrl(vendor))
		.post(`/items/${collection}`)
		.set('Authorization', `Bearer ${token}`)
		.send({});

	if (!response.ok) {
		throw new Error('Could not create item', response.body);
	}

	return response.body.data;
}
