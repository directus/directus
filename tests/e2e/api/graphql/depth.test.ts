import config, { getUrl } from '../../config';
import vendors from '../../get-dbs-to-test';
import request from 'supertest';
import knex, { Knex } from 'knex';
import { createArtist, createEvent, seedTable } from '../../setup/utils/factories';

describe('/graphql', () => {
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

	describe('/ POST', () => {
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
					.post(`/graphql`)
					.set('Authorization', 'Bearer AdminToken')
					.set('Content-Type', 'application/json')
					.send({
						query: `query test {
									artists (filter: {
										id: { _eq: "${artist.id}" } 
									}) {
										events {
											artists_id {
												events {
													artists_id {
														id
													}
												}
											}
										}
									}
								}`,
					})
					.expect('Content-Type', /application\/json/)
					.expect(200);

				expect(response.body.data).toEqual(
					expect.objectContaining({
						artists: expect.arrayContaining([
							expect.objectContaining({
								events: expect.arrayContaining([
									expect.objectContaining({
										artists_id: expect.objectContaining({
											events: expect.arrayContaining([
												expect.objectContaining({
													artists_id: expect.objectContaining({
														id: expect.any(String),
													}),
												}),
											]),
										}),
									}),
								]),
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

				const response = await request(getUrl(vendor))
					.post(`/graphql`)
					.set('Authorization', 'Bearer AdminToken')
					.set('Content-Type', 'application/json')
					.send({
						query: `query test {
									artists (filter: {
										id: { _eq: "${artist.id}" } 
									}) {
										events {
											artists_id {
												events {
													artists_id {
														events {
															artists_id {
																id
															}
														}
													}
												}
											}
										}
									}
								}`,
					})
					.expect('Content-Type', /application\/json/)
					.expect(200);

				expect(response.body.errors).toBeDefined();
				expect(response.body.errors.length).toEqual(1);
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
					.post(`/graphql`)
					.set('Authorization', 'Bearer AdminToken')
					.set('Content-Type', 'application/json')
					.send({
						query: `query test {
									artists (filter: {
										id: { _eq: "${artist.id}" } 
									}) {
										events {
											artists_id {
												events {
													artists_id (filter: { id: { _eq: "${artist.id}" } }) {
														id
													}
												}
											}
										}
									}
								}`,
					})
					.expect('Content-Type', /application\/json/)
					.expect(200);

				expect(response.body.data).toEqual(
					expect.objectContaining({
						artists: expect.arrayContaining([
							expect.objectContaining({
								events: expect.arrayContaining([
									expect.objectContaining({
										artists_id: expect.objectContaining({
											events: expect.arrayContaining([
												expect.objectContaining({
													artists_id: expect.objectContaining({
														id: expect.any(String),
													}),
												}),
											]),
										}),
									}),
								]),
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
				const artistsEvents = await seedTable(
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

				expect(artistsEvents).toBeDefined();
				expect(artistsEvents.length).toEqual(1);
				expect(artistsEvents[0].id).toEqual(expect.any(Number));

				const response = await request(getUrl(vendor))
					.post(`/graphql`)
					.set('Authorization', 'Bearer AdminToken')
					.set('Content-Type', 'application/json')
					.send({
						query: `query test {
									artists {
										events {
											artists_id {
												events {
													artists_id (filter: { events: { id: { _eq: ${artistsEvents[0].id} } } }) {
														id
													}
												}
											}
										}
									}
								}`,
					})
					.expect('Content-Type', /application\/json/)
					.expect(200);

				expect(response.body.errors).toBeDefined();
				expect(response.body.errors.length).toEqual(1);
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
					.post(`/graphql`)
					.set('Authorization', 'Bearer AdminToken')
					.set('Content-Type', 'application/json')
					.send({
						query: `query test {
									artists (filter: {
										id: { _eq: "${artist.id}" } 
									}) {
										events {
											artists_id {
												events {
													artists_id (sort: "id") {
														id
													}
												}
											}
										}
									}
								}`,
					})
					.expect('Content-Type', /application\/json/)
					.expect(200);

				expect(response.body.data).toEqual(
					expect.objectContaining({
						artists: expect.arrayContaining([
							expect.objectContaining({
								events: expect.arrayContaining([
									expect.objectContaining({
										artists_id: expect.objectContaining({
											events: expect.arrayContaining([
												expect.objectContaining({
													artists_id: expect.objectContaining({
														id: expect.any(String),
													}),
												}),
											]),
										}),
									}),
								]),
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
				const artistsEvents = await seedTable(
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

				expect(artistsEvents).toBeDefined();
				expect(artistsEvents.length).toEqual(1);
				expect(artistsEvents[0].id).toEqual(expect.any(Number));

				const response = await request(getUrl(vendor))
					.post(`/graphql`)
					.set('Authorization', 'Bearer AdminToken')
					.set('Content-Type', 'application/json')
					.send({
						query: `query test {
							artists (filter: {
								id: { _eq: "${artist.id}" } 
							}) {
								events {
									artists_id {
										events {
											artists_id (sort: "events.id") {
												id
											}
										}
									}
								}
							}
						}`,
					})
					.expect('Content-Type', /application\/json/)
					.expect(200);

				expect(response.body.errors).toBeDefined();
				expect(response.body.errors.length).toEqual(1);
			});
		});
	});
});
