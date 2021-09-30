import request from 'supertest';
import config from '../config';
import global from '../setup/global';

describe('/server', () => {
	describe('/ping', () => {
		for (const { vendor, knex } of global.knexInstances) {
			const url = `http://localhost:${config.ports[vendor]!}`;

			beforeEach(async () => {
				await knex.schema.createTable('articles', (table) => {
					table.increments();
				});
			});

			afterEach(async () => {
				await knex.schema.dropTableIfExists('articles');
			});

			it(vendor, async () => {
				const response = await request(url)
					.get('/server/ping')
					.expect('Content-Type', /text\/html/)
					.expect(200);

				expect(response.text).toBe('pong');
			});
		}
	});
});
