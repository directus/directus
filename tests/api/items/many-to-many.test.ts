import axios from 'axios';
import request from 'supertest';
import config, { getUrl } from '../../config';
import knex, { Knex } from 'knex';
import vendors from '../../get-dbs-to-test';
import { createArtist, createEvent, createMany, seedTable, Item } from '../../setup/utils/factories';

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
		describe('retrieves an artist and an event off the artists_events table', () => {
			it.each(vendors)('%s', async (vendor) => {
				const artist = createArtist();
				const event = createEvent();
				await seedTable(databases.get(vendor)!, 1, 'artists', artist);
				await seedTable(databases.get(vendor)!, 1, 'events', event);

				const relation = await seedTable(
					databases.get(vendor)!,
					1,
					'artists_events',
					{
						artists_id: artist.id,
						events_id: event.id,
					},
					{
						select: ['id'],
						where: ['artists_id', artist.id],
					}
				);

				const response = await request(getUrl(vendor))
					.get(
						`/items/artists_events/${relation[relation.length - 1].id}?fields[]=artists_id.name&fields[]=events_id.cost`
					)
					.set('Authorization', 'Bearer AdminToken')
					.expect('Content-Type', /application\/json/)
					.expect(200);

				expect(response.body.data).toMatchObject({
					artists_id: { name: expect.any(String) },
					events_id: { cost: expect.any(Number) },
				});
			});
		});
	});

	describe('/:collection/:id GraphQL Query', () => {
		describe('retrieves an artist and an event off the artists_events table', () => {
			it.each(vendors)('%s', async (vendor) => {
				const artist = createArtist();
				const event = createEvent();
				await seedTable(databases.get(vendor)!, 1, 'artists', artist);
				await seedTable(databases.get(vendor)!, 1, 'events', event);

				const relation = await seedTable(
					databases.get(vendor)!,
					1,
					'artists_events',
					{
						artists_id: artist.id,
						events_id: event.id,
					},
					{
						select: ['id'],
						where: ['artists_id', artist.id],
					}
				);

				const query = `
				{
					artists_events_by_id (id: ${relation[relation.length - 1].id}) {
						artists_id {
							name
						}
						events_id {
							cost
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

				expect(data.artists_events_by_id).toMatchObject({
					artists_id: { name: expect.any(String) },
					events_id: { cost: expect.any(Number) },
				});
			});
		});

		describe('should get users of the directus_roles table with read permissions to directus_users', () => {
			it.each(vendors)('%s', async (vendor) => {
				const query = `
				{
					roles {
						id
						users {
							id
						}
					}
				}`;

				const response = await request(getUrl(vendor))
					.post('/graphql/system')
					.send({ query })
					.set('Authorization', 'Bearer AdminToken')
					.expect('Content-Type', /application\/json/)
					.expect(200);

				const { data } = response.body;

				expect(data.roles[data.roles.length - 1]).toMatchObject({
					id: expect.any(String),
					users: expect.arrayContaining([
						expect.objectContaining({
							id: expect.any(String),
						}),
					]),
				});
			});
		});

		describe('should not get users of the directus_roles table without read permissions to directus_users', () => {
			it.each(vendors)('%s', async (vendor) => {
				const query = `
				{
					roles {
						id
						users
					}
				}`;

				const response = await request(getUrl(vendor))
					.post('/graphql/system')
					.send({ query })
					.set('Authorization', 'Bearer UserToken')
					.expect('Content-Type', /application\/json/)
					.expect(400);

				const { errors } = response.body;

				expect(errors[0].extensions.code).toBe('GRAPHQL_VALIDATION_EXCEPTION');
				expect(errors[0].extensions.graphqlErrors[0].message).toBe(
					'Cannot query field "users" on type "directus_roles".'
				);
			});
		});
	});

	describe('/:collection/:id PATCH', () => {
		describe('updates one artists_events to a different artist', () => {
			it.each(vendors)('%s', async (vendor) => {
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
				const body = { artists_id: insertedArtist[0].id };
				const response: any = await axios.patch(`${getUrl(vendor)}/items/artists_events/${relation[0].id}`, body, {
					headers: {
						Authorization: 'Bearer AdminToken',
						'Content-Type': 'application/json',
					},
				});

				expect(response.data.data).toMatchObject({
					artists_id: insertedArtist[0].id,
				});
			});
		});
	});
	describe('/:collection/:id DELETE', () => {
		describe('deletes an artists_events without deleting the artist or event', () => {
			it.each(vendors)('%s', async (vendor) => {
				const artist = createArtist();
				const event = createEvent();
				await seedTable(databases.get(vendor)!, 1, 'artists', artist, {
					select: ['id'],
				});
				await seedTable(databases.get(vendor)!, 1, 'events', event, {
					select: ['id'],
				});
				const item = await seedTable(
					databases.get(vendor)!,
					1,
					'artists_events',
					{
						artists_id: artist.id,
						events_id: event.id,
					},
					{ select: ['id'], where: ['events_id', event.id] }
				);
				const response: any = await axios.delete(`${getUrl(vendor)}/items/artists_events/${item[item.length - 1].id}`, {
					headers: {
						Authorization: 'Bearer AdminToken',
						'Content-Type': 'application/json',
					},
				});

				expect(response.data.data).toBe(undefined);
				expect(await databases.get(vendor)!('artists_events').select('*').where('id', item[0].id)).toMatchObject([]);
				expect(await databases.get(vendor)!('artists').select('name').where('id', artist.id)).toMatchObject([
					{ name: artist.name },
				]);

				expect(await databases.get(vendor)!('events').select('cost').where('id', event.id)).toMatchObject([
					{ cost: event.cost },
				]);
			});
		});
	});
	describe('/:collection GET', () => {
		describe('retrieves artists and events for each entry in artists_events', () => {
			it.each(vendors)('%s', async (vendor) => {
				const artist = createArtist();
				const event = createEvent();
				await seedTable(databases.get(vendor)!, 1, 'artists', artist, {
					select: ['id'],
				});
				await seedTable(databases.get(vendor)!, 1, 'events', event, {
					select: ['id'],
				});

				await seedTable(databases.get(vendor)!, 10, 'artists_events', {
					artists_id: artist.id,
					events_id: event.id,
				});
				const response = await request(getUrl(vendor))
					.get(`/items/artists_events?fields[]=artists_id.name&fields[]=events_id.cost`)
					.set('Authorization', 'Bearer AdminToken')
					.expect('Content-Type', /application\/json/)
					.expect(200);

				expect(response.body.data[0]).toMatchObject({
					artists_id: { name: expect.any(String) },
					events_id: { cost: expect.any(Number) },
				});
				expect(response.body.data.length).toBeGreaterThanOrEqual(10);
			});
		});
	});

	describe('/:collection POST', () => {
		describe('createOne', () => {
			describe('creates an artist_events entry', () => {
				it.each(vendors)('%s', async (vendor) => {
					const artist = createArtist();
					const event = createEvent();
					await seedTable(databases.get(vendor)!, 1, 'artists', artist, {
						select: ['id'],
					});
					await seedTable(databases.get(vendor)!, 1, 'events', event, {
						select: ['id'],
					});
					const body = {
						artists_id: artist.id,
						events_id: event.id,
					};

					const response: any = await axios.post(`${getUrl(vendor)}/items/artists_events`, body, {
						headers: {
							Authorization: 'Bearer AdminToken',
							'Content-Type': 'application/json',
						},
					});

					expect(response.data.data).toMatchObject({
						// Cockroach has auto-int in int8 (BigInt)
						id: expect.anything(),
						artists_id: expect.any(String),
						events_id: expect.any(String),
					});
				});
			});
		});
		describe('createMany', () => {
			describe('creates 5 artist_events entries', () => {
				it.each(vendors)('%s', async (vendor) => {
					const artist = createArtist();
					const event = createEvent();
					await seedTable(databases.get(vendor)!, 1, 'artists', artist, {
						select: ['id'],
					});
					await seedTable(databases.get(vendor)!, 1, 'events', event, {
						select: ['id'],
					});
					const body = createMany({}, 10, { artists_id: artist.id, events_id: event.id });
					const response: any = await axios.post(`${getUrl(vendor)}/items/artists_events`, body, {
						headers: {
							Authorization: 'Bearer AdminToken',
							'Content-Type': 'application/json',
						},
					});
					expect(response.data.data.length).toBeGreaterThanOrEqual(10);
					expect(response.data.data[0]).toMatchObject({
						artists_id: expect.any(String),
						events_id: expect.any(String),
					});
				});
			});
		});
	});

	describe('/:collection PATCH', () => {
		describe('updates many artists_events to a different artist', () => {
			it.each(vendors)('%s', async (vendor) => {
				const artist = createArtist();
				const event = createEvent();
				await seedTable(databases.get(vendor)!, 1, 'artists', artist, {
					select: ['id'],
				});
				await seedTable(databases.get(vendor)!, 1, 'events', event, {
					select: ['id'],
				});
				const items = await seedTable(
					databases.get(vendor)!,
					10,
					'artists_events',
					{
						artists_id: artist.id,
						events_id: event.id,
					},
					{ select: ['id'], where: ['events_id', event.id] }
				);
				const keys: any[] = [];
				Object.values(items).forEach((item: any) => {
					keys.push(item.id);
				});
				const body = {
					keys: keys,
					data: { events_id: event.id },
				};
				const response: any = await axios.patch(`${getUrl(vendor)}/items/artists_events/?fields=events_id.cost`, body, {
					headers: {
						Authorization: 'Bearer AdminToken',
						'Content-Type': 'application/json',
					},
				});
				for (let row = 0; row < response.data.data.length; row++) {
					expect(response.data.data[row].events_id).toMatchObject({
						cost: event.cost,
					});
				}
				expect(response.data.data.length).toBe(keys.length);
			});
		});
	});
	describe('/:collection DELETE', () => {
		describe('deletes many artists_events without deleting the artists or events', () => {
			it.each(vendors)('%s', async (vendor) => {
				const artist = createArtist();
				const event = createEvent();
				await seedTable(databases.get(vendor)!, 1, 'artists', artist, {
					select: ['id'],
				});
				await seedTable(databases.get(vendor)!, 1, 'events', event, {
					select: ['id'],
				});
				const items = await seedTable(
					databases.get(vendor)!,
					10,
					'artists_events',
					{
						artists_id: artist.id,
						events_id: event.id,
					},
					{ select: ['id'], where: ['events_id', event.id] }
				);
				const body: any[] = [];
				items
					.sort(function (a: any, b: any) {
						return b.id - a.id;
					})
					.forEach((item: Item) => {
						body.push(item.id);
					});
				const response: any = await axios.delete(`${getUrl(vendor)}/items/artists_events/`, {
					headers: {
						Authorization: 'Bearer AdminToken',
						'Content-Type': 'application/json',
					},
					data: JSON.stringify(body),
				});

				expect(response.data.data).toBe(undefined);
				for (let row = 0; row < items.length; row++) {
					expect(await databases.get(vendor)!('artists_events').select('*').where('id', items[row].id)).toMatchObject(
						[]
					);
				}
				expect((await databases.get(vendor)!('artists').select('name').where('id', artist.id))[0].name).toBe(
					artist.name
				);

				expect((await databases.get(vendor)!('events').select('cost').where('id', event.id))[0].cost).toBe(event.cost);
			});
		});
	});
});
