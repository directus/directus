import request from 'supertest';
import vendors from '../get-dbs-to-test';
import { getUrl } from '../config';

describe('/server', () => {
	describe('/ping', () => {
		it.each(vendors)('%s', async (vendor) => {
			const response = await request(getUrl(vendor))
				.get('/server/ping')
				.expect('Content-Type', /text\/html/)
				.expect(200);

			expect(response.text).toBe('pong');
		});
	});
});
