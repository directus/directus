import { getUrl } from '@common/config';
import { CreateItem } from '@common/functions';
import type { Vendor } from '@common/get-dbs-to-test';
import { SeedFunctions } from '@common/seed-functions';
import type { PrimaryKeyType } from '@common/types';
import { USER } from '@common/variables';
import request from 'supertest';
import { expect } from 'vitest';
import type { TestsFieldSchema } from '../../query/filter';

export const seedRelationalFields = async (
	vendor: Vendor,
	collection: string,
	pkType: PrimaryKeyType,
	testsSchema: TestsFieldSchema,
) => {
	try {
		// Create items
		let generatedStringIdCounter = 0;

		for (const key of Object.keys(testsSchema)) {
			// Oracle does not have a time datatype
			if (vendor === 'oracle' && testsSchema[key].type === 'time') {
				continue;
			}

			const items = [];

			if (testsSchema[key].children) {
				const response = await request(getUrl(vendor))
					.get(`/items/${testsSchema[key].relatedCollection}`)
					.set('Authorization', `Bearer ${USER.TESTS_FLOW.TOKEN}`)
					.query({ fields: 'id', limit: -1 });

				const primaryKeys = response.body.data.map((item: any) => item.id);

				if (pkType === 'string') {
					for (const pk of primaryKeys) {
						items.push({
							id: SeedFunctions.generateValues.string({
								quantity: 1,
								seed: `relational-id-${generatedStringIdCounter}`,
							})[0],
							[testsSchema[key].field]: pk,
						});

						generatedStringIdCounter++;
					}
				} else {
					for (const pk of primaryKeys) {
						items.push({
							[testsSchema[key].field]: pk,
						});
					}
				}
			}

			if (items.length > 0) {
				await CreateItem(vendor, {
					collection: collection,
					item: items,
				});
			}
		}

		expect(true).toBeTruthy();
	} catch (error) {
		expect(error).toBeFalsy();
	}
};
