import { CreateCollection, CreateField, CreateItem, DeleteCollection } from '@common/functions';
import vendors from '@common/get-dbs-to-test';
import { randomUUID, type UUID } from 'node:crypto';
import { expect, it } from 'vitest';

export const collection = 'test_filter';

export type Articles = {
	id?: number | string;
	user_created: UUID;
	date_created: string;
};

export const seedDBStructure = () => {
	it.each(vendors)(
		'%s',
		async (vendor) => {
			try {
				await DeleteCollection(vendor, { collection });

				await CreateCollection(vendor, {
					collection: collection,
					primaryKeyType: 'integer',
				});

				await CreateField(vendor, {
					collection: collection,
					field: 'user_created',
					type: 'uuid',
				});

				expect(true).toBeTruthy();
			} catch (error) {
				expect(error).toBeFalsy();
			}
		},
		300000,
	);
};

export const seedDBValues = async () => {
	let isSeeded = true;

	const promises = vendors.map(async (vendor) => {
		await CreateItem(vendor, {
			collection,
			item: {
				id: '1',
				user_created: randomUUID(),
				date_created: new Date().toISOString(),
			},
		});

		await CreateItem(vendor, {
			collection,
			item: {
				id: '2',
				user_created: randomUUID(),
				date_created: new Date().toISOString(),
			},
		});
	});

	await Promise.all(promises)
		.then(() => {
			isSeeded = true;
		})
		.catch(() => {
			isSeeded = false;
		});

	return isSeeded;
};
