import { getUrl } from '@common/config';
import { CreateItem } from '@common/functions';
import vendors from '@common/get-dbs-to-test';
import { USER } from '@common/variables';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { collection } from './case-when.seed';

describe('retrieves items with filters', async () => {
	const userToken = 'pp2KIAA3mGdgqngRVDuegxNuVj7gM-es';

	it.each(vendors)('%s', async (vendor) => {
		const userResponse = await request(getUrl(vendor))
			.post(`/users`)
			.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`)
			.send({
				first_name: `${collection} user`,
				token: userToken,
				policies: {
					create: [
						{
							policy: {
								name: `${collection} policy`,
								permissions: {
									create: [
										{
											policy: '+',
											permissions: {
												_and: [
													{
														user_created: {
															id: {
																_eq: '$CURRENT_USER',
															},
														},
													},
												],
											},
											validation: null,
											fields: ['id', 'user_created', 'date_created'],
											presets: null,
											collection,
											action: 'read',
										},
										{
											policy: '+',
											permissions: null,
											validation: null,
											fields: ['*'],
											presets: null,
											collection,
											action: 'create',
										},
									],
									update: [],
									delete: [],
								},
								app_access: true,
							},
						},
					],
					update: [],
					delete: [],
				},
			});

		if (!userResponse.ok) {
			throw new Error('Could not create user', userResponse.body);
		}

		// Create a single item with the admin token
		await CreateItem(vendor, { collection, item: {}, token: USER.ADMIN.TOKEN });

		// Create two items with user token
		await CreateItem(vendor, { collection, item: [{}, {}], token: userToken });

		// User with the above policy should only be able to read items that they have created themselves.
		const itemsResponse = await request(getUrl(vendor))
			.get(`/items/${collection}`)
			.set('Authorization', `Bearer ${userToken}`)
			.expect(200);

		expect(itemsResponse.body.data.length).toBe(2);

		// A simple groupBy query
		// The query for which the deduplication was implemented
		const groupByResponse = await request(getUrl(vendor))
			.get(`/items/${collection}?groupBy=user_created`)
			.set('Authorization', `Bearer ${userToken}`)
			.expect(200);

		expect(groupByResponse.body.data.length).toBe(1);

		// A groupBy query with aggregation
		// The query for which the deduplication was implemented
		const groupByWithAggregationResponse = await request(getUrl(vendor))
			.get(`/items/${collection}?groupBy=day(date_created)&aggregate[count]=*`)
			.set('Authorization', `Bearer ${userToken}`)
			.expect(200);

		expect(groupByWithAggregationResponse.body.data.length).toBe(1);
		// Depending on the database, it returns either an integer or a string, so is is being casted here.
		expect(Number(groupByWithAggregationResponse.body.data[0].count)).toBe(2);

		// A query which produces a case when statement in the final query
		// where the fields to compare, have different data types:
		// user_created is a string, whereas directus_users.id is a of type UUID.
		const comparisonResult = await request(getUrl(vendor))
			.get(
				`/comments?filter[_and][0][collection][_eq]=directus_users&filter[_and][1][item][_eq]=${userResponse.body.data.id}&aggregate[count]=id`,
			)
			.set('Authorization', `Bearer ${userToken}`)
			.expect(200);

		expect(Number(comparisonResult.body.data[0].count.id)).toBe(0);
	});
});
