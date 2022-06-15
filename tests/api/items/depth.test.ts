import config, { getUrl } from '../../config';
import vendors from '../../get-dbs-to-test';
import request from 'supertest';
import knex, { Knex } from 'knex';
import { createArtist, createEvent, seedTable } from '../../setup/utils/factories';

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

	describe('/:collection GET', () => {
		describe('allow queries up to the field depth limit', () => {
			it.each(vendors)('%s', async (vendor) => {
				const artist = createArtist();
				const event = createEvent();
				await seedTable(databases.get(vendor)!, 1, 'artists', artist);
				await seedTable(databases.get(vendor)!, 1, 'events', event);
				await seedTable(databases.get(vendor)!, 1, 'artists_events', {
					artists_id: artist.id,
					events_id: event.id,
				});

				const response = await request(getUrl(vendor))
					.get(`/items/artists/${artist.id}?fields=*.*.*.*.*`)
					.set('Authorization', 'Bearer AdminToken')
					.expect('Content-Type', /application\/json/)
					.expect(200);

				expect(response.body.data).toEqual(
					expect.objectContaining({
						events: expect.arrayContaining([
							expect.objectContaining({
								artists_id: expect.objectContaining({
									events: expect.arrayContaining([
										expect.objectContaining({
											artists_id: expect.objectContaining({
												events: [expect.any(Number)],
											}),
										}),
									]),
								}),
							}),
						]),
					})
				);
			});
		});

		describe('deny queries over the field depth limit', () => {
			it.each(vendors)('%s', async (vendor) => {
				const artist = createArtist();
				const event = createEvent();
				await seedTable(databases.get(vendor)!, 1, 'artists', artist);
				await seedTable(databases.get(vendor)!, 1, 'events', event);
				await seedTable(databases.get(vendor)!, 1, 'artists_events', {
					artists_id: artist.id,
					events_id: event.id,
				});

				await request(getUrl(vendor))
					.get(`/items/artists/${artist.id}?fields=*.*.*.*.*.*`)
					.set('Authorization', 'Bearer AdminToken')
					.expect('Content-Type', /application\/json/)
					.expect(400);
			});
		});

		describe('allow queries up to deep depth limit', () => {
			it.each(vendors)('%s', async (vendor) => {
				const artist = createArtist();
				const event = createEvent();
				await seedTable(databases.get(vendor)!, 1, 'artists', artist);
				await seedTable(databases.get(vendor)!, 1, 'events', event);
				await seedTable(databases.get(vendor)!, 1, 'artists_events', {
					artists_id: artist.id,
					events_id: event.id,
				});

				const response = await request(getUrl(vendor))
					.get(
						`/items/artists/${artist.id}?fields=*.*.*.*.*&deep[events][_filter][artists_id][events][artists_id][id][_eq]=${artist.id}`
					)
					.set('Authorization', 'Bearer AdminToken')
					.expect('Content-Type', /application\/json/)
					.expect(200);

				expect(response.body.data).toEqual(
					expect.objectContaining({
						events: expect.arrayContaining([
							expect.objectContaining({
								artists_id: expect.objectContaining({
									events: expect.arrayContaining([
										expect.objectContaining({
											artists_id: expect.objectContaining({
												events: [expect.any(Number)],
											}),
										}),
									]),
								}),
							}),
						]),
					})
				);
			});
		});

		describe('deny queries over the deep depth limit', () => {
			it.each(vendors)('%s', async (vendor) => {
				const artist = createArtist();
				const event = createEvent();
				await seedTable(databases.get(vendor)!, 1, 'artists', artist);
				await seedTable(databases.get(vendor)!, 1, 'events', event);
				await seedTable(databases.get(vendor)!, 1, 'artists_events', {
					artists_id: artist.id,
					events_id: event.id,
				});

				await request(getUrl(vendor))
					.get(
						`/items/artists/${artist.id}?fields=*.*.*.*.*&deep[events][_filter][artists_id][events][artists_id][events][id][_eq]=${event.id}`
					)
					.set('Authorization', 'Bearer AdminToken')
					.expect('Content-Type', /application\/json/)
					.expect(400);
			});
		});

		describe('allow queries up to filter depth limit', () => {
			it.each(vendors)('%s', async (vendor) => {
				const artist = createArtist();
				const event = createEvent();
				await seedTable(databases.get(vendor)!, 1, 'artists', artist);
				await seedTable(databases.get(vendor)!, 1, 'events', event);
				await seedTable(databases.get(vendor)!, 1, 'artists_events', {
					artists_id: artist.id,
					events_id: event.id,
				});

				const response = await request(getUrl(vendor))
					.get(
						`/items/artists/${artist.id}?fields=*.*.*.*.*&filter[events][artists_id][events][artists_id][id][_eq]=${artist.id}`
					)
					.set('Authorization', 'Bearer AdminToken')
					.expect('Content-Type', /application\/json/)
					.expect(200);

				expect(response.body.data).toEqual(
					expect.objectContaining({
						events: expect.arrayContaining([
							expect.objectContaining({
								artists_id: expect.objectContaining({
									events: expect.arrayContaining([
										expect.objectContaining({
											artists_id: expect.objectContaining({
												events: [expect.any(Number)],
											}),
										}),
									]),
								}),
							}),
						]),
					})
				);
			});
		});

		describe('deny queries over the filter depth limit', () => {
			it.each(vendors)('%s', async (vendor) => {
				const artist = createArtist();
				const event = createEvent();
				await seedTable(databases.get(vendor)!, 1, 'artists', artist);
				await seedTable(databases.get(vendor)!, 1, 'events', event);
				await seedTable(databases.get(vendor)!, 1, 'artists_events', {
					artists_id: artist.id,
					events_id: event.id,
				});

				await request(getUrl(vendor))
					.get(
						`/items/artists/${artist.id}?fields=*.*.*.*.*&filter[events][artists_id][events][artists_id][events][id][_eq]=${event.id}`
					)
					.set('Authorization', 'Bearer AdminToken')
					.expect('Content-Type', /application\/json/)
					.expect(400);
			});
		});

		describe('allow queries up to sort depth limit', () => {
			it.each(vendors)('%s', async (vendor) => {
				const artist = createArtist();
				const event = createEvent();
				await seedTable(databases.get(vendor)!, 1, 'artists', artist);
				await seedTable(databases.get(vendor)!, 1, 'events', event);
				await seedTable(databases.get(vendor)!, 1, 'artists_events', {
					artists_id: artist.id,
					events_id: event.id,
				});

				const response = await request(getUrl(vendor))
					.get(`/items/artists/${artist.id}?fields=*.*.*.*.*&sort=events.artists_id.events.artists_id.id`)
					.set('Authorization', 'Bearer AdminToken')
					.expect('Content-Type', /application\/json/)
					.expect(200);

				expect(response.body.data).toEqual(
					expect.objectContaining({
						events: expect.arrayContaining([
							expect.objectContaining({
								artists_id: expect.objectContaining({
									events: expect.arrayContaining([
										expect.objectContaining({
											artists_id: expect.objectContaining({
												events: [expect.any(Number)],
											}),
										}),
									]),
								}),
							}),
						]),
					})
				);
			});
		});

		describe('deny queries over the sort depth limit', () => {
			it.each(vendors)('%s', async (vendor) => {
				const artist = createArtist();
				const event = createEvent();
				await seedTable(databases.get(vendor)!, 1, 'artists', artist);
				await seedTable(databases.get(vendor)!, 1, 'events', event);
				await seedTable(databases.get(vendor)!, 1, 'artists_events', {
					artists_id: artist.id,
					events_id: event.id,
				});

				await request(getUrl(vendor))
					.get(`/items/artists/${artist.id}?fields=*.*.*.*.*&sort=events.artists_id.events.artists_id.events.id`)
					.set('Authorization', 'Bearer AdminToken')
					.expect('Content-Type', /application\/json/)
					.expect(400);
			});
		});

		describe('allow queries up to deep sort depth limit', () => {
			it.each(vendors)('%s', async (vendor) => {
				const artist = createArtist();
				const event = createEvent();
				await seedTable(databases.get(vendor)!, 1, 'artists', artist);
				await seedTable(databases.get(vendor)!, 1, 'events', event);
				await seedTable(databases.get(vendor)!, 1, 'artists_events', {
					artists_id: artist.id,
					events_id: event.id,
				});

				const response = await request(getUrl(vendor))
					.get(`/items/artists/${artist.id}?fields=*.*.*.*.*&deep[events][_sort]=artists_id.events.artists_id.id`)
					.set('Authorization', 'Bearer AdminToken')
					.expect('Content-Type', /application\/json/)
					.expect(200);

				expect(response.body.data).toEqual(
					expect.objectContaining({
						events: expect.arrayContaining([
							expect.objectContaining({
								artists_id: expect.objectContaining({
									events: expect.arrayContaining([
										expect.objectContaining({
											artists_id: expect.objectContaining({
												events: [expect.any(Number)],
											}),
										}),
									]),
								}),
							}),
						]),
					})
				);
			});
		});

		describe('deny queries over the deep sort depth limit', () => {
			it.each(vendors)('%s', async (vendor) => {
				const artist = createArtist();
				const event = createEvent();
				await seedTable(databases.get(vendor)!, 1, 'artists', artist);
				await seedTable(databases.get(vendor)!, 1, 'events', event);
				await seedTable(databases.get(vendor)!, 1, 'artists_events', {
					artists_id: artist.id,
					events_id: event.id,
				});

				await request(getUrl(vendor))
					.get(
						`/items/artists/${artist.id}?fields=*.*.*.*.*&deep[events][_sort]=artists_id.events.artists_id.events.id`
					)
					.set('Authorization', 'Bearer AdminToken')
					.expect('Content-Type', /application\/json/)
					.expect(400);
			});
		});
	});
});
