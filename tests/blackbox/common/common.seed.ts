import { DeleteCollection } from './functions';
import vendors from './get-dbs-to-test';
import { USER } from './variables';
import fs from 'node:fs/promises';
import request from 'supertest';
import { expect, it } from 'vitest';
import { getUrl } from './config';

export const collectionName = 'common_test_collection';
export const collectionNameM2O = 'common_test_collection_m2o';
export const collectionNameO2M = 'common_test_collection_o2m';

export const seedDBStructure = async () => {
	const { totalTestsCount } = JSON.parse(await fs.readFile('sequencer-data.json', 'utf8'));

	it.each(vendors)('%s', async (vendor) => {
		try {
			// Delete existing collections
			await DeleteCollection(vendor, { collection: collectionNameO2M });
			await DeleteCollection(vendor, { collection: collectionNameM2O });
			await DeleteCollection(vendor, { collection: collectionName });

			// Update total count in tests flow
			const response = await request(getUrl(vendor))
				.post(`/items/tests_flow_data`)
				.send({ total_tests_count: totalTestsCount })
				.set('Authorization', `Bearer ${USER.TESTS_FLOW.TOKEN}`);

			expect(response.statusCode).toBe(200);
		} catch (error) {
			expect(error).toBeFalsy();
		}
	});
};
