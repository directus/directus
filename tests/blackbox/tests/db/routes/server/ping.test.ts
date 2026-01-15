import { getUrl } from '@common/config';
import vendors from '@common/get-dbs-to-test';
import { requestGraphQL } from '@common/transport';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

describe('/server', () => {
	describe('GET /ping', () => {
		it.each(vendors)('%s', async (vendor) => {
			// Action
			const response = await request(getUrl(vendor))
				.get('/server/ping')
				.expect('Content-Type', /text\/html/)
				.expect(200);

			const gqlResponse = await requestGraphQL(getUrl(vendor), true, null, {
				query: {
					server_ping: true,
				},
			});

			// Assert
			expect(response.text).toBe('pong');
			expect(gqlResponse.body.data.server_ping).toBe('pong');
		});
	});
});
