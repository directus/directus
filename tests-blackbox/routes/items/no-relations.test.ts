import request from 'supertest';
import { getUrl } from '@common/config';
import vendors from '@common/get-dbs-to-test';
import { v4 as uuid } from 'uuid';
import { CreateItem } from '@common/functions';
import * as common from '@common/index';
import { collectionArtists, collectionGuests, collectionEvents, collectionArtistsEvents } from './no-relations.seed';

type Artist = {
	id?: number;
	name: string;
};

type Guest = {
	id?: number;
	name: string;
	favorite_artist?: number;
};

type Event = {
	id?: number;
	description: string;
	cost: number;
};

function createArtist(): Artist {
	return {
		name: 'artist-' + uuid(),
	};
}

function createGuest(): Guest {
	return {
		name: 'guest-' + uuid(),
	};
}

function createEvent(): Event {
	return {
		description: 'event-' + uuid(),
		cost: Math.floor(Math.random() * 100),
	};
}

describe('/items', () => {
	describe('GET /:collection/:id', () => {
		describe('retrieves one artist', () => {
			it.each(vendors)('%s', async (vendor) => {
				// Setup
				const artist = await CreateItem(vendor, { collection: collectionArtists, item: createArtist() });

				// Action
				const response = await request(getUrl(vendor))
					.get(`/items/${collectionArtists}/${artist.id}`)
					.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

				// Assert
				expect(response.statusCode).toEqual(200);
				expect(response.body.data).toMatchObject({ name: expect.any(String) });
			});
		});
		describe(`retrieves a guest's favorite artist`, () => {
			it.each(vendors)('%s', async (vendor) => {
				// Setup
				const insertedArtist = await CreateItem(vendor, { collection: collectionArtists, item: createArtist() });
				const guest = createGuest();
				guest.favorite_artist = insertedArtist.id;
				const insertedGuest = await CreateItem(vendor, { collection: collectionGuests, item: guest });

				// Action
				const response = await request(getUrl(vendor))
					.get(`/items/${collectionGuests}/${insertedGuest.id}`)
					.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

				// Assert
				expect(response.statusCode).toEqual(200);
				expect(response.body.data).toMatchObject({ favorite_artist: insertedArtist.id });
			});
		});
		describe('retrieves an artist and an event off the artists_events table', () => {
			it.each(vendors)('%s', async (vendor) => {
				// Setup
				const insertedArtist = await CreateItem(vendor, { collection: collectionArtists, item: createArtist() });
				const insertedEvent = await CreateItem(vendor, { collection: collectionEvents, item: createEvent() });
				const insertedArtistsEvent = await CreateItem(vendor, {
					collection: collectionArtistsEvents,
					item: {
						artists_id: insertedArtist.id,
						events_id: insertedEvent.id,
					},
				});

				// Action
				const response = await request(getUrl(vendor))
					.get(
						`/items/${collectionArtistsEvents}/${insertedArtistsEvent.id}?fields[]=artists_id.name&fields[]=events_id.cost`
					)
					.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

				// Assert
				expect(response.statusCode).toEqual(200);
				expect(response.body.data).toMatchObject({
					artists_id: { name: expect.any(String) },
					events_id: { cost: expect.any(Number) },
				});
			});
		});
		describe('Error handling', () => {
			describe('returns an error when an invalid id is used', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Action
					const response = await request(getUrl(vendor))
						.get(`/items/${collectionArtists}/invalid_id`)
						.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

					// Assert
					expect(response.statusCode).toBe(403);
				});
			});
			describe('returns an error when an invalid table is used', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Action
					const response = await request(getUrl(vendor))
						.get(`/items/invalid_table/1`)
						.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

					// Assert
					expect(response.status).toBe(403);
				});
			});
		});
	});
	describe('PATCH /:collection/:id', () => {
		describe(`updates one artist's name with no relations`, () => {
			it.each(vendors)('%s', async (vendor) => {
				// Setup
				const insertedArtist = await CreateItem(vendor, { collection: collectionArtists, item: createArtist() });
				const body = { name: 'Tommy Cash' };

				// Action
				const response = await request(getUrl(vendor))
					.patch(`/items/${collectionArtists}/${insertedArtist.id}`)
					.send(body)
					.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

				// Assert
				expect(response.statusCode).toEqual(200);
				expect(response.body.data).toMatchObject({
					id: insertedArtist.id,
					name: 'Tommy Cash',
				});
			});
		});
	});
	describe('DELETE /:collection/:id', () => {
		describe('deletes an artist with no relations', () => {
			it.each(vendors)('%s', async (vendor) => {
				// Setup
				const insertedArtist = await CreateItem(vendor, { collection: collectionArtists, item: createArtist() });

				// Action
				const response = await request(getUrl(vendor))
					.delete(`/items/${collectionArtists}/${insertedArtist.id}`)
					.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

				// Assert
				expect(response.statusCode).toEqual(204);
				expect(response.body.data).toBe(undefined);
			});
		});
	});
	describe('GET /:collection', () => {
		describe('retrieves all items from artist table with no relations', () => {
			it.each(vendors)('%s', async (vendor) => {
				// Setup
				const artists = [];
				const artistsCount = 50;
				for (let i = 0; i < artistsCount; i++) {
					artists.push(createArtist());
				}
				await CreateItem(vendor, { collection: collectionArtists, item: artists });

				// Action
				const response = await request(getUrl(vendor))
					.get(`/items/${collectionArtists}`)
					.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

				// Assert
				expect(response.statusCode).toEqual(200);
				expect(response.body.data.length).toBeGreaterThanOrEqual(artistsCount);
			});
		});
		describe('Error handling', () => {
			describe('returns an error when an invalid table is used', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Action
					const response = await request(getUrl(vendor))
						.get(`/items/invalid_table`)
						.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

					// Assert
					expect(response.statusCode).toBe(403);
				});
			});
		});
	});

	describe('POST /:collection', () => {
		describe('createOne', () => {
			describe('creates one artist', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Setup
					const artist = createArtist();

					// Action
					const response = await request(getUrl(vendor))
						.post(`/items/${collectionArtists}`)
						.send(artist)
						.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

					// Assert
					expect(response.statusCode).toEqual(200);
					expect(response.body.data).toMatchObject({ name: artist.name });
				});
			});
		});
		describe('createMany', () => {
			describe('creates 5 artists', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Setup
					const artists = [];
					const artistsCount = 5;
					for (let i = 0; i < artistsCount; i++) {
						artists.push(createArtist());
					}

					// Action
					const response = await request(getUrl(vendor))
						.post(`/items/${collectionArtists}`)
						.send(artists)
						.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

					// Assert
					expect(response.statusCode).toEqual(200);
					expect(response.body.data.length).toBe(artistsCount);
				});
			});
		});
		describe('Error handling', () => {
			describe('returns an error when an invalid table is used', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Setup
					const artist = createArtist();

					// Action
					const response = await request(getUrl(vendor))
						.post(`/items/invalid_table`)
						.send(artist)
						.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

					// Assert
					expect(response.statusCode).toBe(403);
				});
			});
		});
	});

	describe('PATCH /:collection', () => {
		describe('updates many artists to a different name', () => {
			it.each(vendors)('%s', async (vendor) => {
				// Setup
				const artists = [];
				const artistsCount = 5;
				for (let i = 0; i < artistsCount; i++) {
					artists.push(createArtist());
				}

				const insertedArtists = await CreateItem(vendor, { collection: collectionArtists, item: artists });
				const keys = Object.values(insertedArtists ?? []).map((item: any) => item.id);

				const body = {
					keys: keys,
					data: { name: 'Johnny Cash' },
				};

				// Action
				const response = await request(getUrl(vendor))
					.patch(`/items/${collectionArtists}?fields=name`)
					.send(body)
					.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

				// Assert
				expect(response.statusCode).toEqual(200);
				for (let row = 0; row < response.body.data.length; row++) {
					expect(response.body.data[row]).toMatchObject({
						name: 'Johnny Cash',
					});
				}
				expect(response.body.data.length).toBe(keys.length);
			});
		});
	});

	describe('DELETE /:collection', () => {
		describe('deletes many artists with no relations', () => {
			it.each(vendors)('%s', async (vendor) => {
				// Setup
				const artists = [];
				const artistsCount = 10;
				for (let i = 0; i < artistsCount; i++) {
					artists.push(createArtist());
				}

				const insertedArtists = await CreateItem(vendor, { collection: collectionArtists, item: artists });
				const keys = Object.values(insertedArtists ?? []).map((item: any) => item.id);

				// Action
				const response = await request(getUrl(vendor))
					.delete(`/items/${collectionArtists}`)
					.send(keys)
					.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

				// Assert
				expect(response.statusCode).toEqual(204);
				expect(response.body.data).toBe(undefined);
			});
		});
	});
});
