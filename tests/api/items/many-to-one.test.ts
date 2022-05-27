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

	describe('/:collection/:id GET', () => {
		describe(`retrieves a guest's favorite artist`, () => {
			it.each(vendors)('%s', async (vendor) => {
				const artist = createArtist();
				const guest = createGuest();
				await seedTable(databases.get(vendor)!, 1, 'artists', artist);
				guest.favorite_artist = artist.id;
				await seedTable(databases.get(vendor)!, 1, 'guests', guest);

				const response = await request(getUrl(vendor))
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
				const artist = createArtist();
				const name = 'test-user';
				await seedTable(databases.get(vendor)!, 1, 'artists', artist);
				const guests = createMany(createGuest, 10, { name, favorite_artist: artist.id });
				await seedTable(databases.get(vendor)!, 1, 'guests', guests);

				const response = (
					await request(getUrl(vendor))
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

	describe('/:collection GraphQL Query', () => {
		describe('retrieves all items from guest table with favorite_artist', () => {
			it.each(vendors)('%s', async (vendor) => {
				const artist = createArtist();
				const name = 'test-user';
				await seedTable(databases.get(vendor)!, 1, 'artists', artist);
				const guests = createMany(createGuest, 10, { name, favorite_artist: artist.id });
				await seedTable(databases.get(vendor)!, 1, 'guests', guests);

				const query = `
				{
					guests (filter: { name: { _eq: "${name}" } }) {
						birthday
						favorite_artist {
							name
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

				expect(data.guests.length).toBeGreaterThanOrEqual(10);
				expect(data.guests[data.guests.length - 1]).toMatchObject({
					birthday: expect.any(String),
					favorite_artist: expect.objectContaining({
						name: expect.any(String),
					}),
				});
			});
		});

		describe('Should get "favorite_artist" field with ID string when retrieving all items from guests without read permission to artists', () => {
			it.each(vendors)('%s', async (vendor) => {
				const artist = createArtist();
				const name = 'test-user';
				await seedTable(databases.get(vendor)!, 1, 'artists', artist);
				const guests = createMany(createGuest, 10, { name, favorite_artist: artist.id });
				await seedTable(databases.get(vendor)!, 1, 'guests', guests);

				const query = `
				{
					guests (filter: { name: { _eq: "${name}" } }) {
						favorite_artist
					}
				}`;

				const response = await request(getUrl(vendor))
					.post('/graphql')
					.send({ query })
					.set('Authorization', 'Bearer UserToken')
					.expect('Content-Type', /application\/json/)
					.expect(200);

				const { data } = response.body;

				expect(data.guests.length).toBeGreaterThanOrEqual(10);
				expect(data.guests[data.guests.length - 1]).toMatchObject({
					favorite_artist: expect.any(String),
				});
			});
		});

		describe('Should not get nested fields in "favourite_artist" when retrieving all items from guests without read permission to artists', () => {
			it.each(vendors)('%s', async (vendor) => {
				const artist = createArtist();
				const name = 'test-user';
				await seedTable(databases.get(vendor)!, 1, 'artists', artist);
				const guests = createMany(createGuest, 10, { name, favorite_artist: artist.id });
				await seedTable(databases.get(vendor)!, 1, 'guests', guests);

				const query = `
				{
					guests (filter: { name: { _eq: "${name}" } }) {
						favorite_artist {
							name
						}
					}
				}`;

				const response = await request(getUrl(vendor))
					.post('/graphql')
					.send({ query })
					.set('Authorization', 'Bearer UserToken')
					.expect('Content-Type', /application\/json/)
					.expect(400);

				const { errors } = response.body;

				expect(errors[0].extensions.code).toBe('GRAPHQL_VALIDATION_EXCEPTION');
				expect(errors[0].extensions.graphqlErrors[0].message).toBe(
					'Field "favorite_artist" must not have a selection since type "String" has no subfields.'
				);
			});
		});
	});

	describe('/:collection POST', () => {
		describe('createOne', () => {
			describe('creates one guest with a favorite_artist', () => {
				it.each(vendors)('%s', async (vendor) => {
					const artist = createArtist();
					const body = createGuest();
					body.favorite_artist = artist;

					const response: any = await axios.post(`${getUrl(vendor)}/items/guests`, body, {
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
					const artist = createArtist();
					await seedTable(databases.get(vendor)!, 1, 'artists', artist);
					const body = createMany(createGuest, 5, { favorite_artist: artist.id });

					const response: any = await axios.post(`${getUrl(vendor)}/items/guests`, body, {
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
