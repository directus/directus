import { getUrl } from '@common/config';
import request from 'supertest';
import vendors from '@common/get-dbs-to-test';

describe('/server', () => {
	describe('GET /ping', () => {
		it.each(vendors)('%s', async (vendor) => {
			// Action
			const response = await request(getUrl(vendor))
				.get('/server/ping')
				.expect('Content-Type', /text\/html/)
				.expect(200);

			// Assert
			expect(response.text).toBe('pong');
		});
	});
});
