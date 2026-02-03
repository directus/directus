import { getUrl } from '@common/config';
import vendors from '@common/get-dbs-to-test';
import { requestGraphQL } from '@common/transport';
import { TEST_USERS, USER } from '@common/variables';
import { SMTPServer } from 'smtp-server';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('/server', () => {
	describe('GET /health', () => {
		let fakeSMTPServer: SMTPServer;

		beforeAll(async () => {
			fakeSMTPServer = new SMTPServer({
				authOptional: true,
				hideSTARTTLS: true,
				onData(_stream, _, cb) {
					cb();
				},
			});

			await new Promise<void>((resolve) =>
				fakeSMTPServer.listen(1025, '127.0.0.1', () => {
					resolve();
				}),
			);
		}, 180_000);

		afterAll(async () => {
			await new Promise<void>((resolve) =>
				fakeSMTPServer.close(() => {
					resolve();
				}),
			);
		});

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
							status: expect.stringMatching(/ok|warn/),
							releaseId: expect.any(String),
							serviceId: expect.any(String),
							checks: expect.anything(),
						};

						expect(response.body).toEqual(adminResult);
						expect(gqlResponse.body.data.server_health).toEqual(adminResult);
					} else {
						const nonAdminResult = { status: expect.stringMatching(/ok|warn/) };

						expect(response.body).toEqual(nonAdminResult);
						expect(gqlResponse.body.data.server_health).toEqual(nonAdminResult);
					}
				});
			});
		});
	});
});
