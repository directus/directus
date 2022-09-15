import config, { getUrl } from '../../config';
import vendors from '../../get-dbs-to-test';
import request from 'supertest';
import knex, { Knex } from 'knex';
import { createGuest, seedTable, createMany } from '../../setup/utils/factories';

describe('/items', () => {
	const databases = new Map<string, Knex>();

	beforeAll(async () => {
		for (const vendor of vendors) {
			databases.set(vendor, knex(config.knexConfig[vendor]!));
		}
	});

	afterAll(async () => {
		for (const [_vendor, connection] of databases) {
			await connection.destroy();
		}
	});

	beforeEach(async () => {
		for (const [, connection] of databases) {
			await connection('guests').delete();
		}
	});

	describe('/:collection GET', () => {
		describe('returns count correctly', () => {
			it.each(vendors)('%s', async (vendor) => {
				const count = 10;
				const guests: any[] = createMany(createGuest, count);
				await seedTable(databases.get(vendor)!, 1, 'guests', guests);

				const response = await request(getUrl(vendor))
					.get(`/items/guests?aggregate[count]=id`)
					.set('Authorization', 'Bearer AdminToken')
					.expect('Content-Type', /application\/json/)
					.expect(200);

				const { data } = response.body;
				expect(data[0]).toMatchObject({
					count: {
						id: guests.length,
					},
				});
			});
		});
	});

	describe('/:collection GraphQL Query', () => {
		describe('returns count correctly', () => {
			it.each(vendors)('%s', async (vendor) => {
				const count = 10;
				const guests: any[] = createMany(createGuest, count);
				await seedTable(databases.get(vendor)!, 1, 'guests', guests);

				const query = `
				{
					guests_aggregated {
						count {
							id
						}
					}
				}`;

				const response = await request(getUrl(vendor))
					.post('/graphql')
					.send({ query })
					.set('Authorization', 'Bearer AdminToken')
					.expect('Content-Type', /application\/json/)
					.expect(200);

				const { data } = response.body;

				expect(data.guests_aggregated[0]).toMatchObject({
					count: {
						id: guests.length,
					},
				});
			});
		});
	});
});
