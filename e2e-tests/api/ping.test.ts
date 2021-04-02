import request from 'supertest';

describe('/server', () => {
	it('/ping', () => {
		return request('http://localhost:6100')
			.get('/server/ping')
			.expect('Content-Type', /text\/html/)
			.expect(200)
			.then((response) => {
				expect(response.text).toBe('pong');
			});
	});
});
