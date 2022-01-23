import axios from 'axios';
import request from 'supertest';
import config from '../../config';
import vendors from '../../get-dbs-to-test';
import knex, { Knex } from 'knex';
import { createArtist, createGuest, createMany, seedTable } from '../../setup/utils/factories';
import { internet } from 'faker';

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

	describe('/:collection/:id GET', () => {
		describe(`retrieves a guest's favorite artist`, () => {
			it.each(vendors)('%s', async (vendor) => {
				const url = `http://localhost:${config.envs[vendor]!.PORT!}`;
				const artist = createArtist();
				const guest = createGuest();
				await seedTable(databases.get(vendor)!, 1, 'artists', artist);
				guest.favorite_artist = artist.id;
				await seedTable(databases.get(vendor)!, 1, 'guests', guest);

				const response = await request(url)
					.get(`/items/guests/${guest.id}?fields=favorite_artist.*`)
					.set('Authorization', 'Bearer AdminToken')
					.expect('Content-Type', /application\/json/)
					.expect(200);

				expect(response.body.data).toMatchObject({ favorite_artist: { name: artist.name } });
			});
		});
	});

	describe('/:collection GET', () => {
		describe('retrieves all items from guest table with favorite_artist', () => {
			it.each(vendors)('%s', async (vendor) => {
				const url = `http://localhost:${config.envs[vendor]!.PORT!}`;
				const artist = createArtist();
				const name = internet.userName();
				await seedTable(databases.get(vendor)!, 1, 'artists', artist);
				const guests = createMany(createGuest, 10, { name, favorite_artist: artist.id });
				await seedTable(databases.get(vendor)!, 1, 'guests', guests);

				const response = (
					await request(url)
						.get(`/items/guests?filter={"name": { "_eq": "${name}" }}`)
						.set('Authorization', 'Bearer AdminToken')
						.expect('Content-Type', /application\/json/)
						.expect(200)
				).body.data;

				expect(response.length).toBeGreaterThanOrEqual(10);
				expect(response[response.length - 1]).toMatchObject({
					birthday: expect.any(String),
					favorite_artist: expect.any(String),
				});
			});
		});
	});

	describe('/:collection POST', () => {
		describe('createOne', () => {
			describe('creates one guest with a favorite_artist', () => {
				it.each(vendors)('%s', async (vendor) => {
					const url = `http://localhost:${config.envs[vendor]!.PORT!}`;
					const artist = createArtist();
					const body = createGuest();
					body.favorite_artist = artist;

					const response: any = await axios.post(`${url}/items/guests`, body, {
						headers: {
							Authorization: 'Bearer AdminToken',
							'Content-Type': 'application/json',
						},
					});
					expect(response.data.data).toMatchObject({ name: body.name, favorite_artist: expect.any(String) });
				});
			});
		});
		describe('createMany', () => {
			describe('creates 5 users with a favorite_artist', () => {
				it.each(vendors)('%s', async (vendor) => {
					const url = `http://localhost:${config.envs[vendor]!.PORT!}`;
					const artist = createArtist();
					await seedTable(databases.get(vendor)!, 1, 'artists', artist);
					const body = createMany(createGuest, 5, { favorite_artist: artist.id });

					const response: any = await axios.post(`${url}/items/guests`, body, {
						headers: {
							Authorization: 'Bearer AdminToken',
							'Content-Type': 'application/json',
						},
					});
					expect(response.data.data.length).toBe(body.length);
					expect(response.data.data[0]).toMatchObject({ favorite_artist: expect.any(String) });
				});
			});
		});
	});
	// describe('/:collection/:id PATCH', () => {});
	// describe('/:collection PATCH', () => {});
	// describe('/:collection/:id DELETE', () => {});
	// describe('/:collection DELETE', () => {});
});
