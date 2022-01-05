import axios from 'axios';
import request from 'supertest';
import config from '../../config';
import vendors from '../../get-dbs-to-test';
import knex, { Knex } from 'knex';
import { createArtist, createEvent, createGuest, createMany, seedTable } from '../../setup/utils/factories';
import { v4 as uuid } from 'uuid';

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
		it.each(vendors)('%p retrieves one artist', async (vendor) => {
			const url = `http://localhost:${config.envs[vendor]!.PORT!}`;
			const artist = createArtist();
			await seedTable(databases.get(vendor)!, 1, 'artists', artist);

			const response = await request(url)
				.get(`/items/artists/${artist.id}`)
				.set('Authorization', 'Bearer AdminToken')
				.expect('Content-Type', /application\/json/)
				.expect(200);

			expect(response.body.data).toMatchObject({ name: expect.any(String) });
		});
		it.each(vendors)(`%p retrieves a guest's favorite artist`, async (vendor) => {
			const url = `http://localhost:${config.envs[vendor]!.PORT!}`;
			const guest = createGuest();
			const artist = createArtist();
			await seedTable(databases.get(vendor)!, 1, 'artists', artist, {
				select: ['id'],
			});
			guest.favorite_artist = artist.id;
			await seedTable(databases.get(vendor)!, 1, 'guests', guest, {
				select: ['id'],
				where: ['name', guest.name],
			});

			const response = await request(url)
				.get(`/items/artists/${artist.id}`)
				.set('Authorization', 'Bearer AdminToken')
				.expect('Content-Type', /application\/json/)
				.expect(200);

			expect(response.body.data).toMatchObject({ name: expect.any(String) });
		});
		it.each(vendors)(`%p retrieves an artist and an event off the artists_events table`, async (vendor) => {
			const url = `http://localhost:${config.envs[vendor]!.PORT!}`;
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
					artists_id: insertedArtist[insertedArtist.length - 1].id,
					events_id: insertedEvent[insertedEvent.length - 1].id,
				},
				{ select: ['id'], where: ['events_id', insertedEvent[insertedEvent.length - 1].id] }
			);
			const response = await request(url)
				.get(`/items/artists_events/${relation[0].id}?fields[]=artists_id.name&fields[]=events_id.cost`)
				.set('Authorization', 'Bearer AdminToken')
				.expect('Content-Type', /application\/json/)
				.expect(200);

			expect(response.body.data).toMatchObject({
				artists_id: { name: expect.any(String) },
				events_id: { cost: expect.any(Number) },
			});
		});
		describe('Error handling', () => {
			it.each(vendors)('%p returns an error when an invalid id is used', async (vendor) => {
				const url = `http://localhost:${config.envs[vendor]!.PORT!}`;

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
			it.each(vendors)('%p returns an error when an invalid table is used', async (vendor) => {
				const url = `http://localhost:${config.envs[vendor]!.PORT!}`;

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
	describe('/:collection/:id PATCH', () => {
		it.each(vendors)(`%p updates one artist's name with no relations`, async (vendor) => {
			const url = `http://localhost:${config.envs[vendor]!.PORT!}`;
			const artist = createArtist();
			await seedTable(databases.get(vendor)!, 1, 'artists', artist);

			const body = { name: 'Tommy Cash' };
			const response: any = await axios.patch(`${url}/items/artists/${artist.id}`, body, {
				headers: { Authorization: 'Bearer AdminToken' },
			});

			expect(response.data.data).toMatchObject({
				id: expect.any(String),
				name: 'Tommy Cash',
			});
		});
	});
	describe('/:collection/:id DELETE', () => {
		it.each(vendors)(`%p deletes an artist with no relations`, async (vendor) => {
			const url = `http://localhost:${config.envs[vendor]!.PORT!}`;
			const artist = createArtist();
			await seedTable(databases.get(vendor)!, 1, 'artists', artist);

			const response: any = await axios.delete(`${url}/items/artists/${artist.id}`, {
				headers: {
					Authorization: 'Bearer AdminToken',
					'Content-Type': 'application/json',
				},
			});

			expect(response.data.data).toBe(undefined);
			expect(await databases.get(vendor)!('artists').select('*').where('id', artist.id)).toStrictEqual([]);
		});
	});
	describe('/:collection GET', () => {
		it.each(vendors)('%p retrieves all items from artist table with no relations', async (vendor) => {
			const url = `http://localhost:${config.envs[vendor]!.PORT!}`;
			await seedTable(databases.get(vendor)!, 50, 'artists', createArtist);
			const response = await request(url)
				.get('/items/artists')
				.set('Authorization', 'Bearer AdminToken')
				.expect('Content-Type', /application\/json/)
				.expect(200);

			expect(response.body.data.length).toBeGreaterThanOrEqual(50);
		});
		describe('Error handling', () => {
			it.each(vendors)('%p returns an error when an invalid table is used', async (vendor) => {
				const url = `http://localhost:${config.envs[vendor]!.PORT!}`;

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
			it.each(vendors)('%p creates one artist', async (vendor) => {
				const url = `http://localhost:${config.envs[vendor]!.PORT!}`;
				const body = createArtist();
				const response: any = await axios.post(`${url}/items/artists`, body, {
					headers: {
						Authorization: 'Bearer AdminToken',
						'Content-Type': 'application/json',
					},
				});
				expect(response.data.data).toMatchObject({ name: body.name });
			});
		});
		describe('createMany', () => {
			it.each(vendors)('%p creates 5 artists', async (vendor) => {
				const url = `http://localhost:${config.envs[vendor]!.PORT!}`;
				const body = createMany(createArtist, 5)!;
				const response: any = await axios.post(`${url}/items/artists`, body, {
					headers: {
						Authorization: 'Bearer AdminToken',
						'Content-Type': 'application/json',
					},
				});
				expect(response.data.data.length).toBe(body.length);
			});
		});
		describe('Error handling', () => {
			it.each(vendors)('%p returns an error when an invalid table is used', async (vendor) => {
				const url = `http://localhost:${config.envs[vendor]!.PORT!}`;
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

	describe('/:collection PATCH', () => {
		it.each(vendors)(`%p updates many artists to a different name`, async (vendor) => {
			const url = `http://localhost:${config.envs[vendor]!.PORT!}`;

			let items;
			const keys: any[] = [];
			const artists = createMany(createArtist, 5, { id: uuid });
			if (vendor === 'mssql') {
				items = await seedTable(databases.get(vendor)!, 1, 'artists', artists, {
					raw: 'SELECT TOP(10) id FROM artists ORDER BY id DESC;',
				});
				Object.values(items).forEach((item: any) => {
					keys.push(item.id);
				});
			} else if (vendor !== 'postgres' && vendor !== 'postgres10') {
				items = await seedTable(databases.get(vendor)!, 1, 'artists', artists, {
					raw: 'select id from artists order by id desc limit 10;',
				});
				Object.values(items[0]).forEach((item: any) => {
					keys.push(item.id);
				});
			} else {
				items = await seedTable(databases.get(vendor)!, 1, 'artists', artists, {
					raw: 'select id from artists order by id desc limit 10;',
				});
				Object.values(items.rows).forEach((item: any) => {
					keys.push(item.id);
				});
			}

			const body = {
				keys: keys,
				data: { name: 'Johnny Cash' },
			};
			const response: any = await axios.patch(`${url}/items/artists/?fields=name`, body, {
				headers: {
					Authorization: 'Bearer AdminToken',
					'Content-Type': 'application/json',
				},
			});
			for (let row = 0; row < response.data.data.length; row++) {
				expect(response.data.data[row]).toMatchObject({
					name: 'Johnny Cash',
				});
			}
			expect(response.data.data.length).toBe(keys.length);
		});
	});
	describe('/:collection DELETE', () => {
		it.each(vendors)(`%p deletes many artists with no relations`, async (vendor) => {
			const url = `http://localhost:${config.envs[vendor]!.PORT!}`;
			const artists = createMany(createArtist, 10, { id: uuid });
			await seedTable(databases.get(vendor)!, 1, 'artists', artists);
			const body: any[] = [];
			for (let row = 0; row < artists.length - 1; row++) {
				body.push(artists[row]!.id);
			}
			const response: any = await axios.delete(`${url}/items/artists/`, {
				headers: {
					Authorization: 'Bearer AdminToken',
					'Content-Type': 'application/json',
				},
				data: JSON.stringify(body),
			});

			expect(response.data.data).toBe(undefined);
			for (let row = 0; row < body.length; row++) {
				expect(await databases.get(vendor)!('artists').select('*').where('id', body[row])).toStrictEqual([]);
			}
		});
	});
});
