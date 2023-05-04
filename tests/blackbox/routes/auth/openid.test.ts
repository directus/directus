import request from 'supertest';
import vendors from '@common/get-dbs-to-test';

describe('/auth/login/directus', () => {
	describe('GET /', () => {
		describe('when correct params', () => {
			describe('The redirection URL must have the informed URL parameters', () => {
				it.each(vendors)('%s', async () => {
					const customParams = {
						login_hint: 'example@directus.com',
						display: 'wap'
					};

					const params = new URLSearchParams(customParams).toString();

					// Actions
					const response = await request('http://127.0.0.1:8880')
						.get(`/auth/login/directus?${params}`);

					// Assert Status Code
					expect(response.statusCode).toBe(302);
					expect(response.headers).toHaveProperty('location');

					const location = new URL(response.headers['location']);

					// Assert URL Params
					expect(location.searchParams.get('login_hint')).toBe(customParams.login_hint);
					expect(location.searchParams.get('display')).toBe(customParams.display);
				});
			});
		});

		describe('when incorrect params', () => {
			describe('The redirection URL should NOT contain the URL parameters not allowed in the environment variable', () => {
				it.each(vendors)('%s', async () => {
					const customParams = {
						invalid_query: 'mc-sid',
						display: 'wap' // Valid param
					};

					const params = new URLSearchParams(customParams).toString();

					// Actions
					const response = await request('http://127.0.0.1:8880')
						.get(`/auth/login/directus?${params}`);

					// Assert Status Code
					expect(response.statusCode).toBe(302);
					expect(response.headers).toHaveProperty('location');

					const location = new URL(response.headers['location']);

					// Assert URL Params
					expect(location.searchParams.get('invalid_query')).toBe(null);
				});
			});
		});
	});
});
