import { getUrl } from '@common/config';
import vendors from '@common/get-dbs-to-test';
import { requestGraphQL } from '@common/transport';
import { TEST_USERS, USER } from '@common/variables';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

describe('/server', () => {
	describe('GET /health', () => {
		TEST_USERS.forEach((userKey) => {
			describe(USER[userKey].NAME, () => {
				it.each(vendors)('%s', async (vendor) => {
					// Action
					const response = await request(getUrl(vendor))
						.get('/server/health')
						.set('Authorization', `Bearer ${USER[userKey].TOKEN}`);

					const gqlResponse = await requestGraphQL(getUrl(vendor), true, USER[userKey].TOKEN, {
						query: {
							server_health: true,
						},
					});

					// Assert
					expect(response.statusCode).toBe(200);
					expect(gqlResponse.statusCode).toBe(200);

					if (userKey === USER.ADMIN.KEY) {
						const adminResult = {
							status: 'ok',
							releaseId: expect.any(String),
							serviceId: expect.any(String),
							checks: expect.anything(),
						};

						expect(response.body).toEqual(adminResult);
						expect(gqlResponse.body.data.server_health).toEqual(adminResult);
					} else {
						const nonAdminResult = { status: 'ok' };

						expect(response.body).toEqual(nonAdminResult);
						expect(gqlResponse.body.data.server_health).toEqual(nonAdminResult);
					}
				});
			});
		});
	});
});
