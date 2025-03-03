import { getUrl } from '@common/config';
import vendors from '@common/get-dbs-to-test';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { collection, seedDBValues } from './case-when.seed';
import { USER } from '@common/variables';

describe('retrieves items with filters', async () => {
	const userToken = 'pp2KIAA3mGdgqngRVDuegxNuVj7gM-es';

	it.each(vendors)('%s', async (vendor) => {
		const userResponse = await request(getUrl(vendor))
			.post(`/users`)
			.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`)
			.send({
				first_name: 'john',
				email: 'j@mail.com',
				password: '12345',
				token: 'pp2KIAA3mGdgqngRVDuegxNuVj7gM-es',
				policies: {
					create: [
						{
							policy: {
								name: 'sample',
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
											collection: 'articles_case_when',
											action: 'read',
										},
										{
											policy: '+',
											permissions: null,
											validation: null,
											fields: ['*'],
											presets: null,
											collection: 'articles_case_when',
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

		await seedDBValues(vendor, userToken);

		// Editor can query item the editor created
		const response1 = await request(getUrl(vendor))
			.get(`/items/${collection}`)
			.set('Authorization', `Bearer ${userToken}`);

		expect(response1.statusCode).toEqual(200);
		expect(response1.body.data.length).toBe(2);

		// A groupBy query with aggregation
		// The query for which the deduplication was implemented
		const groupByWithAggregationResponse = await request(getUrl(vendor))
			.get(`/items/${collection}?groupBy=day(date_created)&aggregate[count]=*`)
			.set('Authorization', `Bearer ${userToken}`);

		expect(groupByWithAggregationResponse.statusCode).toEqual(200);
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
			.set('Authorization', `Bearer ${userToken}`);

		expect(comparisonResult.statusCode).toEqual(200);
		// expect(comparisonResult.body.data.length).toBe(1);
	});
});
