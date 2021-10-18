import axios from 'axios';
import request from 'supertest';
import config from '../config';
import { getDBsToTest } from '../get-dbs-to-test';
import knex, { Knex } from 'knex';
import { v4 as uuid } from 'uuid';
import { createArtist, createGuest, createMany, seedTable } from '../setup/utils/factories';

describe('/items', () => {
	const databases = new Map<string, Knex>();
	const userId = uuid();
	const roleId = uuid();

	beforeAll(async () => {
		const vendors = getDBsToTest();

		for (const vendor of vendors) {
			databases.set(vendor, knex(config.knexConfig[vendor]!));
			const database = databases.get(vendor);
			await database!('directus_roles').insert({
				id: roleId,
				name: 'test',
				icon: 'verified',
				admin_access: true,
				description: 'test admin role',
			});

			await database!('directus_users').insert({
				id: userId,
				status: 'active',
				email: 'test@example.com',
				password: 'password',
				first_name: 'Admin',
				last_name: 'User',
				role: roleId,
				token: 'test_token',
			});

			await database!('directus_collections').insert([
				{
					collection: 'guests',
				},
				{
					collection: 'artists',
				},
				{
					collection: 'events',
				},
				{
					collection: 'tours',
				},
				{
					collection: 'organizers',
				},
			]);

			if ((await database!.schema.hasTable('artists')) === false) {
				await database!.schema.createTable('artists', (table) => {
					table.increments('id').primary();
					table.string('name');
					table.json('members');
				});
			}

			if ((await database!.schema.hasTable('guests')) === false) {
				await database!.schema.createTable('guests', (table) => {
					table.increments('id');
					table.string('name');
					table.date('birthday');
					table.string('search_radius');
					table.time('earliest_events_to_show');
					table.time('latest_events_to_show');
					table.string('password');
					table.integer('shows_attended');
					table.integer('favorite_artist').unsigned().references('id').inTable('artists');
				});
			}
		}
	});

	afterAll(async () => {
		for (const [vendor, connection] of databases) {
			const database = databases.get(vendor)!;
			await database('directus_users').where('id', userId).del();
			await database('directus_roles').where('id', roleId).del();
			await database('directus_collections').where('collection', 'guests').del();
			await database('directus_collections').where('collection', 'artists').del();
			await database('directus_collections').where('collection', 'events').del();
			await database('directus_collections').where('collection', 'tours').del();
			await database('directus_collections').where('collection', 'organizers').del();

			await database.schema.dropTableIfExists('artists_events');
			await database.schema.dropTableIfExists('tours_components');
			await database.schema.dropTableIfExists('guests');
			await database.schema.dropTableIfExists('artists');
			await database.schema.dropTableIfExists('events');
			await database.schema.dropTableIfExists('tours');
			await database.schema.dropTableIfExists('organizers');

			connection.destroy();
		}
	});

	describe('/:collection/:id', () => {
		it.each(getDBsToTest())('%p retrieves one artist', async (vendor) => {
			const url = `http://localhost:${config.ports[vendor]!}`;
			seedTable(databases.get(vendor)!, 1, 'artists', createArtist());

			const response = await request(url)
				.get(`/items/artists/1`)
				.set('Authorization', 'Bearer test_token')
				.expect('Content-Type', /application\/json/)
				.expect(200);

			expect(response.body.data).toMatchObject({ name: expect.any(String) });
		});
		it.each(getDBsToTest())(`%p retrieves a guest's favorite artist`, async (vendor) => {
			const url = `http://localhost:${config.ports[vendor]!}`;
			const artist = createArtist();
			const guest = createGuest();
			guest.favorite_artist = 1;
			await seedTable(databases.get(vendor)!, 1, 'artists', artist);
			await seedTable(databases.get(vendor)!, 1, 'guests', guest);
			artist.id = 1;

			const response = await request(url)
				.get('/items/guests/1?fields=favorite_artist.*')
				.set('Authorization', 'Bearer test_token')
				.expect('Content-Type', /application\/json/)
				.expect(200);

			expect(await response.body.data).toMatchObject({ favorite_artist: { name: expect.any(String) } });
		});

		describe('Error handling', () => {
			it.each(getDBsToTest())('%p returns an error when an invalid id is used', async (vendor) => {
				const url = `http://localhost:${config.ports[vendor]!}`;
				seedTable(databases.get(vendor)!, 1, 'artists', createArtist());

				const response = await axios
					.get(`${url}/items/artists/invalid_id`, {
						headers: {
							Authorization: 'Bearer test_token',
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
				seedTable(databases.get(vendor)!, 1, 'artists', createArtist());

				const response = await axios
					.get(`${url}/items/invalid_table/1`, {
						headers: {
							Authorization: 'Bearer test_token',
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
			seedTable(databases.get(vendor)!, 100, 'artists', createArtist);
			const response = await request(url)
				.get('/items/artists')
				.set('Authorization', 'Bearer test_token')
				.expect('Content-Type', /application\/json/)
				.expect(200);

			expect(response.body.data.length).toBe(100);
			expect(Object.keys(response.body.data[0]).sort()).toStrictEqual(['id', 'members', 'name']);
		});
	});

	describe('/:collection POST', () => {
		it.each(getDBsToTest())('%p creates one artist', async (vendor) => {
			const url = `http://localhost:${config.ports[vendor]!}`;
			const body = createArtist();
			const response: any = await axios.post(`${url}/items/artists`, body, {
				headers: {
					Authorization: 'Bearer test_token',
					'Content-Type': 'application/json',
				},
			});
			expect(response.data.data).toMatchObject({ name: body.name });
		});
		it.each(getDBsToTest())('%p creates 45 artists', async (vendor) => {
			const url = `http://localhost:${config.ports[vendor]!}`;
			const body = createMany(createArtist, 45);
			const response: any = await axios.post(`${url}/items/artists`, body, {
				headers: {
					Authorization: 'Bearer test_token',
					'Content-Type': 'application/json',
				},
			});
			expect(response.data.data.length).toBe(body.length);
		});
		describe('Error handling', () => {
			it.each(getDBsToTest())('%p returns an error when an invalid table is used', async (vendor) => {
				const url = `http://localhost:${config.ports[vendor]!}`;
				const body = createArtist();
				const response = await axios
					.post(`${url}/items/invalid_table`, body, {
						headers: {
							Authorization: 'Bearer test_token',
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
