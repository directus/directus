import axios from 'axios';
import request from 'supertest';
import config, { getUrl } from '../../config';
import vendors from '../../get-dbs-to-test';
import knex, { Knex } from 'knex';
import { createArtist, createGuest, createMany, seedTable } from '../../setup/utils/factories';

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

	describe(`retrieve no items using a $FOLLOW filter`, () => {
		it.each(vendors)('%s', async (vendor) => {
			const artist = createArtist();
			const guest = createGuest();
			await seedTable(databases.get(vendor)!, 1, 'artists', artist);
			guest.favorite_artist = artist.id;
			await seedTable(databases.get(vendor)!, 1, 'guests', guest);

			const response = await request(getUrl(vendor))
				.get(
					`/items/artists?fields=id,name&filter={"_and":[{"$FOLLOW(guests,favorite_artist)":{"_some":{"favorite_artist":{"_eq":"not-an-uuid"}}}}]}`
				)
				.set('Authorization', 'Bearer AdminToken')
				.expect('Content-Type', /application\/json/)
				.expect(200);

			expect(response.body.data.length).toBe(0);
		});
	});
	describe(`retrieve all items using a $FOLLOW filter`, () => {
		it.each(vendors)('%s', async (vendor) => {
			const artist = createArtist();
			const guest = createGuest();
			await seedTable(databases.get(vendor)!, 1, 'artists', artist);
			guest.favorite_artist = artist.id;
			await seedTable(databases.get(vendor)!, 1, 'guests', guest);

			const response = await request(getUrl(vendor))
				.get(
					`/items/artists?fields=id,name&filter={"_and":[{"$FOLLOW(guests,favorite_artist)":{"_none":{"favorite_artist":{"_eq":"not-an-uuid"}}}}]}`
				)
				.set('Authorization', 'Bearer AdminToken')
				.expect('Content-Type', /application\/json/)
				.expect(200);

			expect(response.body.data.length).toBeGreaterThan(0);
		});
	});
});
