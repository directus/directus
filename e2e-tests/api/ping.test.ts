import request from 'supertest';
import { getURLsToTest } from '../get-urls-to-test';

describe('/server', () => {
	it('/ping', () =>
		Promise.all(
			getURLsToTest().map((url) =>
				request(url)
					.get('/server/ping')
					.expect('Content-Type', /text\/html/)
					.expect(200)
					.then((response) => {
						expect(response.text).toBe('pong');
					})
			)
		));
});
