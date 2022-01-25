import request from 'supertest';
import config, { getUrl } from '../config';
import vendors from '../get-dbs-to-test';
import knex, { Knex } from 'knex';

describe('/server', () => {
	const databases = new Map<string, Knex>();

	beforeAll(() => {
		for (const vendor of vendors) {
			databases.set(vendor, knex(config.knexConfig[vendor]!));
		}
	});

	afterAll(() => {
		for (const [_vendor, connection] of databases) {
			connection.destroy();
		}
	});

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
