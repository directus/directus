import request from 'supertest';
import { getUrl } from '@common/config';
import vendors from '@common/get-dbs-to-test';
import { v4 as uuid } from 'uuid';
import { CreateItem } from '@common/functions';
import * as common from '@common/index';
import { collectionArtists } from './no-relations.seed';
import { requestGraphQL } from '@common/index';

type Artist = {
	id?: number | string;
	name: string;
};

function createArtist(pkType: common.PrimaryKeyType): Artist {
	const item: Artist = {
		name: 'artist-' + uuid(),
	};

	if (pkType === 'string') {
		item.id = 'artist-' + uuid();
	}

	return item;
}

describe.each(common.PRIMARY_KEY_TYPES)('/items', (pkType) => {
	const localCollectionArtists = `${collectionArtists}_${pkType}`;

	describe(`pkType: ${pkType}`, () => {
		describe('GET /:collection/:id', () => {
			describe('retrieves one artist', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Setup
					const artist = createArtist(pkType);
					const insertedArtist = await CreateItem(vendor, { collection: localCollectionArtists, item: artist });

					// Action
					const response = await request(getUrl(vendor))
						.get(`/items/${localCollectionArtists}/${insertedArtist.id}`)
						.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

					const gqlResponse = await requestGraphQL(getUrl(vendor), false, common.USER.ADMIN.TOKEN, {
						query: {
							[localCollectionArtists]: {
								__args: {
									filter: {
										id: {
											_eq: insertedArtist.id,
										},
									},
								},
								name: true,
							},
						},
					});

					// Assert
					expect(response.statusCode).toEqual(200);
					expect(response.body.data).toMatchObject({ name: artist.name });

					expect(gqlResponse.statusCode).toEqual(200);
					expect(gqlResponse.body.data).toMatchObject({ [localCollectionArtists]: [{ name: artist.name }] });
				});
			});

			describe('Error handling', () => {
				describe('returns an error when an invalid id is used', () => {
					it.each(vendors)('%s', async (vendor) => {
						// Action
						const response = await request(getUrl(vendor))
							.get(`/items/${localCollectionArtists}/invalid_id`)
							.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

						const gqlResponse = await requestGraphQL(getUrl(vendor), false, common.USER.ADMIN.TOKEN, {
							query: {
								[localCollectionArtists]: {
									__args: {
										filter: {
											id: {
												_eq: 'invalid_id',
											},
										},
									},
									id: true,
								},
							},
						});

						// Assert
						expect(response.statusCode).toBe(403);

						expect(gqlResponse.statusCode).toBe(200);

						switch (vendor) {
							case 'sqlite3':
								expect(gqlResponse.body.data[localCollectionArtists].length).toEqual(0);
								break;
							case 'postgres':
							case 'postgres10':
							case 'mssql':
							case 'cockroachdb':
								if (pkType === 'string') {
									expect(gqlResponse.body.data[localCollectionArtists].length).toEqual(0);
								} else {
									expect(gqlResponse.body.errors).toBeDefined();
								}
								break;
							default:
								if (pkType !== 'integer') {
									expect(gqlResponse.body.data[localCollectionArtists].length).toEqual(0);
								} else {
									expect(gqlResponse.body.errors).toBeDefined();
								}
								break;
						}
					});
				});
				describe('returns an error when an invalid table is used', () => {
					it.each(vendors)('%s', async (vendor) => {
						// Action
						const response = await request(getUrl(vendor))
							.get(`/items/invalid_table/1`)
							.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

						const gqlResponse = await requestGraphQL(getUrl(vendor), false, common.USER.ADMIN.TOKEN, {
							query: {
								invalid_table: {
									__args: {
										filter: {
											id: {
												_eq: 1,
											},
										},
									},
									id: true,
								},
							},
						});

						// Assert
						expect(response.status).toBe(403);

						expect(gqlResponse.statusCode).toBe(400);
						expect(gqlResponse.body.errors).toBeDefined();
					});
				});
			});
		});

		describe('PATCH /:collection/:id', () => {
			describe(`updates one artist's name`, () => {
				it.each(vendors)('%s', async (vendor) => {
					// Setup
					const insertedArtist = await CreateItem(vendor, {
						collection: localCollectionArtists,
						item: createArtist(pkType),
					});
					const body = { name: 'Tommy Cash' };

					// Action
					const response = await request(getUrl(vendor))
						.patch(`/items/${localCollectionArtists}/${insertedArtist.id}`)
						.send(body)
						.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

					const mutationKey = `update_${localCollectionArtists}_item`;

					const gqlResponse = await requestGraphQL(getUrl(vendor), false, common.USER.ADMIN.TOKEN, {
						mutation: {
							[mutationKey]: {
								__args: {
									id: insertedArtist.id,
									data: {
										name: 'updated',
									},
								},
								id: true,
								name: true,
							},
						},
					});

					// Assert
					expect(response.statusCode).toEqual(200);
					expect(response.body.data).toMatchObject({
						id: insertedArtist.id,
						name: 'Tommy Cash',
					});

					expect(gqlResponse.statusCode).toBe(200);
					expect(gqlResponse.body.data[mutationKey]).toEqual({
						id: String(insertedArtist.id),
						name: 'updated',
					});
				});
			});
		});

		describe('DELETE /:collection/:id', () => {
			describe('deletes an artist', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Setup
					const insertedArtist = await CreateItem(vendor, {
						collection: localCollectionArtists,
						item: createArtist(pkType),
					});

					const insertedArtist2 = await CreateItem(vendor, {
						collection: localCollectionArtists,
						item: createArtist(pkType),
					});

					// Action
					const response = await request(getUrl(vendor))
						.delete(`/items/${localCollectionArtists}/${insertedArtist.id}`)
						.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

					const mutationKey = `delete_${localCollectionArtists}_item`;

					await requestGraphQL(getUrl(vendor), false, common.USER.ADMIN.TOKEN, {
						mutation: {
							[mutationKey]: {
								__args: {
									id: insertedArtist2.id,
								},
								id: true,
							},
						},
					});

					const gqlResponse = await requestGraphQL(getUrl(vendor), false, common.USER.ADMIN.TOKEN, {
						query: {
							[localCollectionArtists]: {
								__args: {
									filter: {
										id: {
											_eq: insertedArtist2.id,
										},
									},
								},
								id: true,
							},
						},
					});

					// Assert
					expect(response.statusCode).toEqual(204);
					expect(response.body.data).toBe(undefined);

					expect(gqlResponse.statusCode).toBe(200);
					expect(gqlResponse.body.data[localCollectionArtists].length).toEqual(0);
				});
			});
		});

		describe('GET /:collection', () => {
			describe('retrieves all items from artist table', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Setup
					const artists = [];
					const artistsCount = 50;
					for (let i = 0; i < artistsCount; i++) {
						artists.push(createArtist(pkType));
					}
					await CreateItem(vendor, { collection: localCollectionArtists, item: artists });

					// Action
					const response = await request(getUrl(vendor))
						.get(`/items/${localCollectionArtists}`)
						.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

					const gqlResponse = await requestGraphQL(getUrl(vendor), false, common.USER.ADMIN.TOKEN, {
						query: {
							[localCollectionArtists]: {
								id: true,
							},
						},
					});

					// Assert
					expect(response.statusCode).toEqual(200);
					expect(response.body.data.length).toBeGreaterThanOrEqual(artistsCount);

					expect(gqlResponse.statusCode).toBe(200);
					expect(gqlResponse.body.data[localCollectionArtists].length).toBeGreaterThanOrEqual(artistsCount);
				});
			});

			describe('Error handling', () => {
				describe('returns an error when an invalid table is used', () => {
					it.each(vendors)('%s', async (vendor) => {
						// Action
						const response = await request(getUrl(vendor))
							.get(`/items/invalid_table`)
							.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

						const gqlResponse = await requestGraphQL(getUrl(vendor), false, common.USER.ADMIN.TOKEN, {
							query: {
								invalid_table: {
									id: true,
								},
							},
						});

						// Assert
						expect(response.statusCode).toBe(403);

						expect(gqlResponse.statusCode).toBe(400);
						expect(gqlResponse.body.errors).toBeDefined();
					});
				});
			});
		});

		describe('POST /:collection', () => {
			describe('createOne', () => {
				describe('creates one artist', () => {
					it.each(vendors)('%s', async (vendor) => {
						// Setup
						const artist = createArtist(pkType);
						const artist2 = createArtist(pkType);

						// Action
						const response = await request(getUrl(vendor))
							.post(`/items/${localCollectionArtists}`)
							.send(artist)
							.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

						const mutationKey = `create_${localCollectionArtists}_item`;

						const gqlResponse = await requestGraphQL(getUrl(vendor), false, common.USER.ADMIN.TOKEN, {
							mutation: {
								[mutationKey]: {
									__args: {
										data: artist2,
									},
									name: true,
								},
							},
						});

						// Assert
						expect(response.statusCode).toEqual(200);
						expect(response.body.data).toMatchObject({ name: artist.name });

						expect(gqlResponse.statusCode).toEqual(200);
						expect(gqlResponse.body.data[mutationKey]).toMatchObject({ name: artist2.name });
					});
				});
			});

			describe('createMany', () => {
				describe('creates 5 artists', () => {
					it.each(vendors)('%s', async (vendor) => {
						// Setup
						const artists = [];
						const artists2 = [];
						const artistsCount = 5;
						for (let i = 0; i < artistsCount; i++) {
							artists.push(createArtist(pkType));
							artists2.push(createArtist(pkType));
						}

						// Action
						const response = await request(getUrl(vendor))
							.post(`/items/${localCollectionArtists}`)
							.send(artists)
							.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

						const mutationKey = `create_${localCollectionArtists}_items`;

						const gqlResponse = await requestGraphQL(getUrl(vendor), false, common.USER.ADMIN.TOKEN, {
							mutation: {
								[mutationKey]: {
									__args: {
										data: artists2,
									},
									name: true,
								},
							},
						});

						// Assert
						expect(response.statusCode).toEqual(200);
						expect(response.body.data.length).toBe(artistsCount);

						expect(gqlResponse.statusCode).toEqual(200);
						expect(gqlResponse.body.data[mutationKey].length).toBe(artistsCount);
					});
				});
			});

			describe('Error handling', () => {
				describe('returns an error when an invalid table is used', () => {
					it.each(vendors)('%s', async (vendor) => {
						// Setup
						const artist = createArtist(pkType);
						const artist2 = createArtist(pkType);

						// Action
						const response = await request(getUrl(vendor))
							.post(`/items/invalid_table`)
							.send(artist)
							.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

						const mutationKey = `create_invalid_table_item`;

						const gqlResponse = await requestGraphQL(getUrl(vendor), false, common.USER.ADMIN.TOKEN, {
							mutation: {
								[mutationKey]: {
									__args: {
										data: artist2,
									},
									name: true,
								},
							},
						});

						// Assert
						expect(response.statusCode).toBe(403);

						expect(gqlResponse.statusCode).toBe(400);
						expect(gqlResponse.body.errors).toBeDefined();
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
						artists.push(createArtist(pkType));
					}

					const insertedArtists = await CreateItem(vendor, { collection: localCollectionArtists, item: artists });
					const keys = Object.values(insertedArtists ?? []).map((item: any) => item.id);

					const body = {
						keys: keys,
						data: { name: 'Johnny Cash' },
					};

					// Action
					const response = await request(getUrl(vendor))
						.patch(`/items/${localCollectionArtists}?fields=name`)
						.send(body)
						.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

					const mutationKey = `update_${localCollectionArtists}_items`;

					const gqlResponse = await requestGraphQL(getUrl(vendor), false, common.USER.ADMIN.TOKEN, {
						mutation: {
							[mutationKey]: {
								__args: {
									ids: keys,
									data: {
										name: 'updated',
									},
								},
								name: true,
							},
						},
					});

					// Assert
					expect(response.statusCode).toEqual(200);
					for (let row = 0; row < response.body.data.length; row++) {
						expect(response.body.data[row]).toMatchObject({
							name: 'Johnny Cash',
						});
					}
					expect(response.body.data.length).toBe(keys.length);

					expect(gqlResponse.statusCode).toEqual(200);
					for (let row = 0; row < gqlResponse.body.data[mutationKey].length; row++) {
						expect(gqlResponse.body.data[mutationKey][row]).toMatchObject({
							name: 'updated',
						});
					}
					expect(gqlResponse.body.data[mutationKey].length).toBe(keys.length);
				});
			});
		});

		describe('DELETE /:collection', () => {
			describe('deletes many artists', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Setup
					const artists = [];
					const artists2 = [];
					const artistsCount = 10;
					for (let i = 0; i < artistsCount; i++) {
						artists.push(createArtist(pkType));
						artists2.push(createArtist(pkType));
					}

					const insertedArtists = await CreateItem(vendor, { collection: localCollectionArtists, item: artists });
					const keys = Object.values(insertedArtists ?? []).map((item: any) => item.id);

					const insertedArtists2 = await CreateItem(vendor, { collection: localCollectionArtists, item: artists2 });
					const keys2 = Object.values(insertedArtists2 ?? []).map((item: any) => item.id);

					// Action
					const response = await request(getUrl(vendor))
						.delete(`/items/${localCollectionArtists}`)
						.send(keys)
						.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

					const mutationKey = `delete_${localCollectionArtists}_items`;

					await requestGraphQL(getUrl(vendor), false, common.USER.ADMIN.TOKEN, {
						mutation: {
							[mutationKey]: {
								__args: {
									ids: keys2,
								},
								ids: true,
							},
						},
					});

					const gqlResponse = await requestGraphQL(getUrl(vendor), false, common.USER.ADMIN.TOKEN, {
						query: {
							[localCollectionArtists]: {
								__args: {
									filter: {
										id: {
											_in: keys2,
										},
									},
								},
								id: true,
							},
						},
					});

					// Assert
					expect(response.statusCode).toEqual(204);
					expect(response.body.data).toBe(undefined);

					expect(gqlResponse.statusCode).toBe(200);
					expect(gqlResponse.body.data[localCollectionArtists].length).toEqual(0);
				});
			});
		});
	});
});
