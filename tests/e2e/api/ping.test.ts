import request from 'supertest';
import config from '../config';
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
			const url = `http://localhost:${config.envs[vendor]!.PORT!}`;

			const response = await request(url)
				.get('/server/ping')
				.expect('Content-Type', /text\/html/)
				.expect(200);

			expect(response.text).toBe('pong');
		});
	});
});
