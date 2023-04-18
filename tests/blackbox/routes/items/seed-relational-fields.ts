import request from 'supertest';
import { getUrl } from '@common/config';
import { CreateItem, SeedFunctions, PrimaryKeyType } from '@common/index';
import { TestsFieldSchema } from '@query/filter';
import * as common from '@common/index';

export const seedRelationalFields = async (
	vendor: string,
	collection: string,
	pkType: PrimaryKeyType,
	testsSchema: TestsFieldSchema
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
					.set('Authorization', `Bearer ${common.USER.TESTS_FLOW.TOKEN}`)
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
