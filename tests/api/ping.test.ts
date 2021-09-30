import request from 'supertest';
import config from '../config';
import { getDBsToTest } from '../get-dbs-to-test';
import knex, { Knex } from 'knex';

describe('/server', () => {
	const databases = new Map<string, Knex>();

	beforeAll(() => {
		const vendors = getDBsToTest();

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
		it.each(getDBsToTest())('%p', async (vendor) => {
			// const knex = databases.get(vendor);

			const url = `http://localhost:${config.ports[vendor]!}`;

			const response = await request(url)
				.get('/server/ping')
				.expect('Content-Type', /text\/html/)
				.expect(200);

			expect(response.text).toBe('pong');
		});
	});
});
