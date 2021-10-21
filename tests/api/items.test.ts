import axios from 'axios';
import request from 'supertest';
import config from '../config';
import { getDBsToTest } from '../get-dbs-to-test';
import knex, { Knex } from 'knex';
import { createArtist, createEvent, createGuest, createMany, seedTable } from '../setup/utils/factories';

describe('/items', () => {
	const databases = new Map<string, Knex>();

	beforeAll(async () => {
		const vendors = getDBsToTest();

		for (const vendor of vendors) {
			databases.set(vendor, knex(config.knexConfig[vendor]!));
		}
	});

	afterAll(async () => {
		for (const [_vendor, connection] of databases) {
			await connection('guests').truncate();
			await connection.destroy();
		}
	});

	describe('/:collection/:id', () => {
		it.each(getDBsToTest())('%p retrieves one artist', async (vendor) => {
			const url = `http://localhost:${config.ports[vendor]!}`;
			seedTable(databases.get(vendor)!, 1, 'artists', createArtist());

			const response = await request(url)
				.get(`/items/artists/1`)
				.set('Authorization', 'Bearer AdminToken')
				.expect('Content-Type', /application\/json/)
				.expect(200);

			expect(response.body.data).toMatchObject({ name: expect.any(String) });
		});
		it.each(getDBsToTest())(`%p retrieves a guest's favorite artist`, async (vendor) => {
			const url = `http://localhost:${config.ports[vendor]!}`;
			const guest = createGuest();
			const insertedArtist = await seedTable(databases.get(vendor)!, 1, 'artists', createArtist(), {
				select: ['id'],
			});
			guest.favorite_artist = insertedArtist[0].id;
			const insertedGuest = await seedTable(databases.get(vendor)!, 1, 'guests', guest, {
				select: ['id'],
				where: ['name', guest.name],
			});

			const response = await request(url)
				.get(`/items/guests/${insertedGuest[0].id}?fields=favorite_artist.*`)
				.set('Authorization', 'Bearer AdminToken')
				.expect('Content-Type', /application\/json/)
				.expect(200);

			expect(await response.body.data).toMatchObject({ favorite_artist: { name: expect.any(String) } });
		});
		it.each(getDBsToTest())(`%p retrieves an artist and an event off the artists_events table`, async (vendor) => {
			const url = `http://localhost:${config.ports[vendor]!}`;
			const insertedArtist = await seedTable(databases.get(vendor)!, 1, 'artists', createArtist(), {
				select: ['id'],
			});
			const insertedEvent = await seedTable(databases.get(vendor)!, 1, 'events', createEvent(), {
				select: ['id'],
			});
			const relation = await seedTable(
				databases.get(vendor)!,
				1,
				'artists_events',
				{
					artists_id: insertedArtist[0].id,
					events_id: insertedEvent[0].id,
				},
				{
					select: ['id'],
					where: ['id', insertedEvent[0].id],
				}
			);
			const response = await request(url)
				.get(`/items/artists_events/${relation[0].id}?fields[]=artists_id.name&fields[]=events_id.cost`)
				.set('Authorization', 'Bearer AdminToken')
				.expect('Content-Type', /application\/json/)
				.expect(200);

			expect(await response.body.data).toMatchObject({
				artists_id: { name: expect.any(String) },
				events_id: { cost: expect.any(Number) },
			});
		});
		describe('Error handling', () => {
			it.each(getDBsToTest())('%p returns an error when an invalid id is used', async (vendor) => {
				const url = `http://localhost:${config.ports[vendor]!}`;

				const response = await axios
					.get(`${url}/items/artists/invalid_id`, {
						headers: {
							Authorization: 'Bearer AdminToken',
							'Content-Type': 'application/json',
						},
					})
					.catch((error: any) => {
						return error;
					});

				if (vendor === 'mssql' || vendor === 'postgres') {
					expect(response.response.headers['content-type']).toBe('application/json; charset=utf-8');
					expect(response.response.status).toBe(500);
					expect(response.response.statusText).toBe('Internal Server Error');
					expect(response.message).toBe('Request failed with status code 500');
				} else if (vendor === 'mysql' || vendor === 'maria') {
					expect(response.response.headers['content-type']).toBe('application/json; charset=utf-8');
					expect(response.response.status).toBe(403);
					expect(response.response.statusText).toBe('Forbidden');
					expect(response.message).toBe('Request failed with status code 403');
				}
			});
			it.each(getDBsToTest())('%p returns an error when an invalid table is used', async (vendor) => {
				const url = `http://localhost:${config.ports[vendor]!}`;

				const response = await axios
					.get(`${url}/items/invalid_table/1`, {
						headers: {
							Authorization: 'Bearer AdminToken',
							'Content-Type': 'application/json',
						},
					})
					.catch((error: any) => {
						return error;
					});

				expect(response.response.headers['content-type']).toBe('application/json; charset=utf-8');
				expect(response.response.status).toBe(403);
				expect(response.response.statusText).toBe('Forbidden');
				expect(response.message).toBe('Request failed with status code 403');
			});
		});
	});

	describe('/:collection GET', () => {
		it.each(getDBsToTest())('%p retrieves all items from artist table with no relations', async (vendor) => {
			const url = `http://localhost:${config.ports[vendor]!}`;
			seedTable(databases.get(vendor)!, 50, 'artists', createArtist);
			const response = await request(url)
				.get('/items/artists')
				.set('Authorization', 'Bearer AdminToken')
				.expect('Content-Type', /application\/json/)
				.expect(200);

			expect(response.body.data.length).toBeGreaterThanOrEqual(50);
			expect(response.body.data[0]).toMatchObject({
				id: expect.any(Number),
				name: expect.any(String),
			});
		});
		it.each(getDBsToTest())('%p retrieves all items from guest table with favorite_artist', async (vendor) => {
			const url = `http://localhost:${config.ports[vendor]!}`;
			seedTable(databases.get(vendor)!, 10, 'artists', createArtist);
			seedTable(databases.get(vendor)!, 10, 'guests', createMany(createGuest, 10, { favorite_artist: 10 }));

			const response = await request(url)
				.get('/items/guests')
				.set('Authorization', 'Bearer AdminToken')
				.expect('Content-Type', /application\/json/)
				.expect(200);

			expect(response.body.data.length).toBeGreaterThanOrEqual(10);
			expect(response.body.data[0]).toMatchObject({
				birthday: expect.any(String),
				favorite_artist: expect.any(Number),
			});
		});
		describe('Error handling', () => {
			it.each(getDBsToTest())('%p returns an error when an invalid table is used', async (vendor) => {
				const url = `http://localhost:${config.ports[vendor]!}`;

				const response = await axios
					.get(`${url}/items/invalid_table/`, {
						headers: {
							Authorization: 'Bearer AdminToken',
							'Content-Type': 'application/json',
						},
					})
					.catch((error: any) => {
						return error;
					});

				expect(response.response.headers['content-type']).toBe('application/json; charset=utf-8');
				expect(response.response.status).toBe(403);
				expect(response.response.statusText).toBe('Forbidden');
				expect(response.message).toBe('Request failed with status code 403');
			});
		});
	});

	describe('/:collection POST', () => {
		describe('createOne', () => {
			it.each(getDBsToTest())('%p creates one artist', async (vendor) => {
				const url = `http://localhost:${config.ports[vendor]!}`;
				const body = createArtist();
				const response: any = await axios.post(`${url}/items/artists`, body, {
					headers: {
						Authorization: 'Bearer AdminToken',
						'Content-Type': 'application/json',
					},
				});
				expect(response.data.data).toMatchObject({ name: body.name });
			});
			it.each(getDBsToTest())('%p creates one guest with a favorite_artist', async (vendor) => {
				const url = `http://localhost:${config.ports[vendor]!}`;
				const artist = createArtist();
				const body = createGuest();
				body.favorite_artist = artist;

				const response: any = await axios.post(`${url}/items/guests`, body, {
					headers: {
						Authorization: 'Bearer AdminToken',
						'Content-Type': 'application/json',
					},
				});
				expect(response.data.data).toMatchObject({ name: body.name, favorite_artist: expect.any(Number) });
			});
		});
		describe('createMany', () => {
			it.each(getDBsToTest())('%p creates 5 artists', async (vendor) => {
				const url = `http://localhost:${config.ports[vendor]!}`;
				const body = createMany(createArtist, 5);
				const response: any = await axios.post(`${url}/items/artists`, body, {
					headers: {
						Authorization: 'Bearer AdminToken',
						'Content-Type': 'application/json',
					},
				});
				expect(response.data.data.length).toBe(body.length);
			});
			it.each(getDBsToTest())('%p creates 5 users with a favorite_artist', async (vendor) => {
				const url = `http://localhost:${config.ports[vendor]!}`;
				await seedTable(databases.get(vendor)!, 5, 'artists', createArtist);
				const body = createMany(createGuest, 5, { favorite_artist: 5 });

				const response: any = await axios.post(`${url}/items/guests`, body, {
					headers: {
						Authorization: 'Bearer AdminToken',
						'Content-Type': 'application/json',
					},
				});
				expect(response.data.data.length).toBe(body.length);
			});
		});
		describe('Error handling', () => {
			it.each(getDBsToTest())('%p returns an error when an invalid table is used', async (vendor) => {
				const url = `http://localhost:${config.ports[vendor]!}`;
				const body = createArtist();
				const response = await axios
					.post(`${url}/items/invalid_table`, body, {
						headers: {
							Authorization: 'Bearer AdminToken',
							'Content-Type': 'application/json',
						},
					})
					.catch((error: any) => {
						return error;
					});

				expect(response.response.headers['content-type']).toBe('application/json; charset=utf-8');
				expect(response.response.status).toBe(403);
				expect(response.response.statusText).toBe('Forbidden');
				expect(response.message).toBe('Request failed with status code 403');
			});
		});
	});
});
