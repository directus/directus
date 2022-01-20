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
		describe('retrieves one artist', () => {
			it.each(vendors)('%s', async (vendor) => {
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
		});
		describe(`retrieves a guest's favorite artist`, () => {
			it.each(vendors)('%s', async (vendor) => {
				const url = `http://localhost:${config.envs[vendor]!.PORT!}`;
				const artist = createArtist();
				const guest = createGuest();
				guest.favorite_artist = artist.id;
				await seedTable(databases.get(vendor)!, 1, 'artists', artist);
				await seedTable(databases.get(vendor)!, 1, 'guests', guest);

				const response = await request(url)
					.get(`/items/artists/${artist.id}`)
					.set('Authorization', 'Bearer AdminToken')
					.expect('Content-Type', /application\/json/)
					.expect(200);

				expect(response.body.data).toMatchObject({ name: expect.any(String) });
			});
		});
		describe('retrieves an artist and an event off the artists_events table', () => {
			it.each(vendors)('%s', async (vendor) => {
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
		});
		describe('Error handling', () => {
			describe('returns an error when an invalid id is used', () => {
				it.each(vendors)('%s', async (vendor) => {
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

					if (vendor === 'mssql' || vendor === 'postgres' || vendor === 'cockroachdb') {
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
			});
			describe('returns an error when an invalid table is used', () => {
				it.each(vendors)('%s', async (vendor) => {
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
	});
	describe('/:collection/:id PATCH', () => {
		describe(`updates one artist's name with no relations`, () => {
			it.each(vendors)('%s', async (vendor) => {
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
	});
	describe('/:collection/:id DELETE', () => {
		describe('deletes an artist with no relations', () => {
			it.each(vendors)('%s', async (vendor) => {
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
				expect(await databases.get(vendor)!('artists').select('*').where('id', artist.id)).toMatchObject([]);
			});
		});
	});
	describe('/:collection GET', () => {
		describe('retrieves all items from artist table with no relations', () => {
			it.each(vendors)('%s', async (vendor) => {
				const url = `http://localhost:${config.envs[vendor]!.PORT!}`;
				await seedTable(databases.get(vendor)!, 50, 'artists', createArtist);
				const response = await request(url)
					.get('/items/artists')
					.set('Authorization', 'Bearer AdminToken')
					.expect('Content-Type', /application\/json/)
					.expect(200);

				expect(response.body.data.length).toBeGreaterThanOrEqual(50);
			});
		});
		describe('Error handling', () => {
			describe('returns an error when an invalid table is used', () => {
				it.each(vendors)('%s', async (vendor) => {
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
	});

	describe('/:collection POST', () => {
		describe('createOne', () => {
			describe('creates one artist', () => {
				it.each(vendors)('%s', async (vendor) => {
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
		});
		describe('createMany', () => {
			describe('creates 5 artists', () => {
				it.each(vendors)('%s', async (vendor) => {
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
		});
		describe('Error handling', () => {
			describe('returns an error when an invalid table is used', () => {
				it.each(vendors)('%s', async (vendor) => {
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
	});

	describe('/:collection PATCH', () => {
		describe('updates many artists to a different name', () => {
			it.each(vendors)('%s', async (vendor) => {
				const url = `http://localhost:${config.envs[vendor]!.PORT!}`;

				const artists = createMany(createArtist, 5, { id: uuid });
				await seedTable(databases.get(vendor)!, 1, 'artists', artists);
				const items = await databases.get(vendor)?.select('id').from('artists').limit(10);
				const keys = Object.values(items ?? []).map((item: any) => item.id);

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
	});
	describe('/:collection DELETE', () => {
		describe('deletes many artists with no relations', () => {
			it.each(vendors)('%s', async (vendor) => {
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
					expect(await databases.get(vendor)!('artists').select('*').where('id', body[row])).toMatchObject([]);
				}
			});
		});
	});
});
