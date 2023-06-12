import request from 'supertest';
import config, { getUrl } from '@common/config';
import vendors from '@common/get-dbs-to-test';
import { v4 as uuid } from 'uuid';
import { CreateItem } from '@common/functions';
import * as common from '@common/index';
import { collectionArtists } from './no-relation.seed';
import { requestGraphQL } from '@common/index';

type Artist = {
	id?: number | string;
	name: string;
	company?: string;
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

					const body = { name: 'updated' };
					const ws = common.createWebSocketConn(getUrl(vendor), { auth: { access_token: common.USER.ADMIN.TOKEN } });
					await ws.subscribe({ collection: localCollectionArtists });
					const wsGql = common.createWebSocketGql(getUrl(vendor), { auth: { access_token: common.USER.ADMIN.TOKEN } });

					const subscriptionKey = await wsGql.subscribe({
						collection: localCollectionArtists,
						jsonQuery: {
							event: true,
							data: {
								id: true,
								name: true,
							},
						},
					});

					// Action
					const response = await request(getUrl(vendor))
						.patch(`/items/${localCollectionArtists}/${insertedArtist.id}`)
						.send(body)
						.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

					const wsMessages = await ws.getMessages(1);
					const wsGqlMessages = await wsGql.getMessages(1);

					const mutationKey = `update_${localCollectionArtists}_item`;

					const gqlResponse = await requestGraphQL(getUrl(vendor), false, common.USER.ADMIN.TOKEN, {
						mutation: {
							[mutationKey]: {
								__args: {
									id: insertedArtist.id,
									data: {
										name: 'updated2',
									},
								},
								id: true,
								name: true,
							},
						},
					});

					const wsMessagesGql = await ws.getMessages(1);
					ws.conn.close();
					const wsGqlMessagesGql = await wsGql.getMessages(1);
					wsGql.client.dispose();

					// Assert
					expect(response.statusCode).toEqual(200);

					expect(response.body.data).toMatchObject({
						id: insertedArtist.id,
						name: 'updated',
					});

					expect(gqlResponse.statusCode).toBe(200);

					expect(gqlResponse.body.data[mutationKey]).toEqual({
						id: String(insertedArtist.id),
						name: 'updated2',
					});

					for (const { messages, name } of [
						{ messages: wsMessages, name: 'updated' },
						{ messages: wsMessagesGql, name: 'updated2' },
					]) {
						expect(messages?.length).toBe(1);

						expect(messages![0]).toMatchObject({
							type: 'subscription',
							event: 'update',
							data: [
								{
									id: insertedArtist.id,
									name,
									company: null,
								},
							],
						});
					}

					for (const { messages, name } of [
						{ messages: wsGqlMessages, name: 'updated' },
						{ messages: wsGqlMessagesGql, name: 'updated2' },
					]) {
						expect(messages?.length).toBe(1);

						expect(messages![0]).toEqual({
							data: {
								[subscriptionKey]: {
									event: 'update',
									data: {
										id: String(insertedArtist.id),
										name,
									},
								},
							},
						});
					}
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

					const ws = common.createWebSocketConn(getUrl(vendor), { auth: { access_token: common.USER.ADMIN.TOKEN } });
					await ws.subscribe({ collection: localCollectionArtists });
					const wsGql = common.createWebSocketGql(getUrl(vendor), { auth: { access_token: common.USER.ADMIN.TOKEN } });

					const subscriptionKey = await wsGql.subscribe({
						collection: localCollectionArtists,
						jsonQuery: {
							event: true,
							key: true,
						},
					});

					// Action
					const response = await request(getUrl(vendor))
						.delete(`/items/${localCollectionArtists}/${insertedArtist.id}`)
						.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

					const wsMessages = await ws.getMessages(1);
					const wsGqlMessages = await wsGql.getMessages(1);

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

					const wsMessagesGql = await ws.getMessages(1);
					const wsGqlMessagesGql = await wsGql.getMessages(1);

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

					ws.conn.close();
					wsGql.client.dispose();

					// Assert
					expect(response.statusCode).toEqual(204);
					expect(response.body.data).toBe(undefined);

					expect(gqlResponse.statusCode).toBe(200);
					expect(gqlResponse.body.data[localCollectionArtists].length).toEqual(0);

					for (const { messages, id } of [
						{ messages: wsMessages, id: insertedArtist.id },
						{ messages: wsMessagesGql, id: insertedArtist2.id },
					]) {
						expect(messages?.length).toBe(1);

						expect(messages![0]).toMatchObject({
							type: 'subscription',
							event: 'delete',
							data: [String(id)],
						});
					}

					for (const { messages, id } of [
						{ messages: wsGqlMessages, id: insertedArtist.id },
						{ messages: wsGqlMessagesGql, id: insertedArtist2.id },
					]) {
						expect(messages?.length).toBe(1);

						expect(messages![0]).toEqual({
							data: {
								[subscriptionKey]: {
									event: 'delete',
									key: String(id),
								},
							},
						});
					}
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
						artist.name = 'one-' + artist.name;
						const artist2 = createArtist(pkType);
						artist2.name = 'one-' + artist2.name;

						const ws = common.createWebSocketConn(getUrl(vendor), { auth: { access_token: common.USER.ADMIN.TOKEN } });
						await ws.subscribe({ collection: localCollectionArtists });

						const wsGql = common.createWebSocketGql(getUrl(vendor), {
							auth: { access_token: common.USER.ADMIN.TOKEN },
						});

						const subscriptionKey = await wsGql.subscribe({
							collection: localCollectionArtists,
							jsonQuery: {
								event: true,
								data: {
									id: true,
									name: true,
								},
							},
						});

						// Action
						const response = await request(getUrl(vendor))
							.post(`/items/${localCollectionArtists}`)
							.send(artist)
							.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

						const wsMessages = await ws.getMessages(1);
						const wsGqlMessages = await wsGql.getMessages(1);

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

						const wsMessagesGql = await ws.getMessages(1);
						ws.conn.close();
						const wsGqlMessagesGql = await wsGql.getMessages(1);
						wsGql.client.dispose();

						// Assert
						expect(response.statusCode).toEqual(200);
						expect(response.body.data).toMatchObject({ name: artist.name });

						expect(gqlResponse.statusCode).toEqual(200);
						expect(gqlResponse.body.data[mutationKey]).toMatchObject({ name: artist2.name });

						for (const { messages, name } of [
							{ messages: wsMessages, name: artist.name },
							{ messages: wsMessagesGql, name: artist2.name },
						]) {
							expect(messages?.length).toBe(1);

							expect(messages![0]).toMatchObject({
								type: 'subscription',
								event: 'create',
								data: [
									{
										id: expect.anything(),
										name,
										company: null,
									},
								],
							});
						}

						for (const { messages, name } of [
							{ messages: wsGqlMessages, name: artist.name },
							{ messages: wsGqlMessagesGql, name: artist2.name },
						]) {
							expect(messages?.length).toBe(1);

							expect(messages![0]).toEqual({
								data: {
									[subscriptionKey]: {
										event: 'create',
										data: {
											id: expect.anything(),
											name,
										},
									},
								},
							});
						}
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
							const artist = createArtist(pkType);
							artists.push(artist);
							artist.name = 'many-' + artist.name;

							const artist2 = createArtist(pkType);
							artist2.name = 'many-' + artist2.name;
							artists2.push(artist2);
						}

						const ws = common.createWebSocketConn(getUrl(vendor), { auth: { access_token: common.USER.ADMIN.TOKEN } });
						await ws.subscribe({ collection: localCollectionArtists });

						const wsGql = common.createWebSocketGql(getUrl(vendor), {
							auth: { access_token: common.USER.ADMIN.TOKEN },
						});

						const subscriptionKey = await wsGql.subscribe({
							collection: localCollectionArtists,
							jsonQuery: {
								event: true,
								data: {
									id: true,
									name: true,
								},
							},
						});

						// Action
						const response = await request(getUrl(vendor))
							.post(`/items/${localCollectionArtists}`)
							.send(artists)
							.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

						const wsMessages = await ws.getMessages(artistsCount);
						const wsGqlMessages = await wsGql.getMessages(artistsCount);

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

						const wsMessagesGql = await ws.getMessages(artistsCount);
						ws.conn.close();
						const wsGqlMessagesGql = await wsGql.getMessages(artistsCount);
						wsGql.client.dispose();

						// Assert
						expect(response.statusCode).toEqual(200);
						expect(response.body.data.length).toBe(artistsCount);

						expect(gqlResponse.statusCode).toEqual(200);
						expect(gqlResponse.body.data[mutationKey].length).toBe(artistsCount);

						for (const { messages, list } of [
							{ messages: wsMessages, list: artists },
							{ messages: wsMessagesGql, list: artists2 },
						]) {
							expect(messages?.length).toBe(artistsCount);

							expect(messages).toEqual(
								expect.arrayContaining(
									list.map(({ name }) => {
										return {
											type: 'subscription',
											event: 'create',
											data: [
												{
													id: expect.anything(),
													name,
													company: null,
												},
											],
										};
									})
								)
							);
						}

						for (const { messages, list } of [
							{ messages: wsGqlMessages, list: artists },
							{ messages: wsGqlMessagesGql, list: artists2 },
						]) {
							expect(messages?.length).toBe(artistsCount);

							for (let i = 0; i < artistsCount; i++) {
								expect(messages![i]).toEqual({
									data: {
										[subscriptionKey]: {
											event: 'create',
											data: {
												id: expect.anything(),
												name: list[i].name,
											},
										},
									},
								});
							}
						}
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
						data: { name: 'updated' },
					};

					const ws = common.createWebSocketConn(getUrl(vendor), { auth: { access_token: common.USER.ADMIN.TOKEN } });
					await ws.subscribe({ collection: localCollectionArtists });
					const wsGql = common.createWebSocketGql(getUrl(vendor), { auth: { access_token: common.USER.ADMIN.TOKEN } });

					const subscriptionKey = await wsGql.subscribe({
						collection: localCollectionArtists,
						jsonQuery: {
							event: true,
							data: {
								id: true,
								name: true,
							},
						},
					});

					// Action
					const response = await request(getUrl(vendor))
						.patch(`/items/${localCollectionArtists}?fields=name`)
						.send(body)
						.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

					const wsMessages = await ws.getMessages(1);
					const wsGqlMessages = await wsGql.getMessages(artistsCount);

					const mutationKey = `update_${localCollectionArtists}_items`;

					const gqlResponse = await requestGraphQL(getUrl(vendor), false, common.USER.ADMIN.TOKEN, {
						mutation: {
							[mutationKey]: {
								__args: {
									ids: keys,
									data: {
										name: 'updated2',
									},
								},
								name: true,
							},
						},
					});

					const wsMessagesGql = await ws.getMessages(1);
					ws.conn.close();
					const wsGqlMessagesGql = await wsGql.getMessages(artistsCount);
					wsGql.client.dispose();

					// Assert
					expect(response.statusCode).toEqual(200);

					for (let row = 0; row < response.body.data.length; row++) {
						expect(response.body.data[row]).toMatchObject({
							name: 'updated',
						});
					}

					expect(response.body.data.length).toBe(keys.length);

					expect(gqlResponse.statusCode).toEqual(200);

					for (let row = 0; row < gqlResponse.body.data[mutationKey].length; row++) {
						expect(gqlResponse.body.data[mutationKey][row]).toMatchObject({
							name: 'updated2',
						});
					}

					expect(gqlResponse.body.data[mutationKey].length).toBe(keys.length);

					for (const { messages, name } of [
						{ messages: wsMessages, name: 'updated' },
						{ messages: wsMessagesGql, name: 'updated2' },
					]) {
						expect(messages?.length).toBe(1);

						expect(messages![0]).toMatchObject({
							type: 'subscription',
							event: 'update',
							data: keys.map((key) => {
								return {
									id: key,
									name,
									company: null,
								};
							}),
						});
					}

					for (const { messages, name } of [
						{ messages: wsGqlMessages, name: 'updated' },
						{ messages: wsGqlMessagesGql, name: 'updated2' },
					]) {
						expect(messages?.length).toBe(artistsCount);

						expect(messages).toEqual(
							expect.arrayContaining(
								keys.map((id) => {
									return {
										data: {
											[subscriptionKey]: {
												event: 'update',
												data: {
													id: String(id),
													name,
												},
											},
										},
									};
								})
							)
						);
					}
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

					const ws = common.createWebSocketConn(getUrl(vendor), { auth: { access_token: common.USER.ADMIN.TOKEN } });
					await ws.subscribe({ collection: localCollectionArtists });
					const wsGql = common.createWebSocketGql(getUrl(vendor), { auth: { access_token: common.USER.ADMIN.TOKEN } });

					const subscriptionKey = await wsGql.subscribe({
						collection: localCollectionArtists,
						jsonQuery: {
							event: true,
							key: true,
						},
					});

					// Action
					const response = await request(getUrl(vendor))
						.delete(`/items/${localCollectionArtists}`)
						.send(keys)
						.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

					const wsMessages = await ws.getMessages(1);
					const wsGqlMessages = await wsGql.getMessages(artistsCount);

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

					const wsMessagesGql = await ws.getMessages(1);
					ws.conn.close();
					const wsGqlMessagesGql = await wsGql.getMessages(artistsCount);
					wsGql.client.dispose();

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

					for (const { messages, ids } of [
						{ messages: wsMessages, ids: keys },
						{ messages: wsMessagesGql, ids: keys2.map((key) => String(key)) },
					]) {
						expect(messages?.length).toBe(1);

						expect(messages![0]).toMatchObject({
							type: 'subscription',
							event: 'delete',
							data: ids,
						});
					}

					for (const { messages, id } of [
						{ messages: wsGqlMessages, id: keys },
						{ messages: wsGqlMessagesGql, id: keys2.map((key) => String(key)) },
					]) {
						expect(messages?.length).toBe(artistsCount);

						for (let i = 0; i < artistsCount; i++) {
							expect(messages![i]).toEqual({
								data: {
									[subscriptionKey]: {
										event: 'delete',
										key: String(id[i]),
									},
								},
							});
						}
					}
				});
			});
		});

		describe('Verify createOne action hook run', () => {
			it.each(vendors)('%s', async (vendor) => {
				// Action
				const response = await request(getUrl(vendor))
					.get('/items/tests_extensions_log')
					.query({
						filter: JSON.stringify({
							key: {
								_starts_with: `action-verify-create/${collectionArtists}_${pkType}/one`,
							},
						}),
					})
					.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

				// Assert
				expect(response.statusCode).toBe(200);
				expect(response.body.data.length).toBe(2);

				for (const log of response.body.data) {
					expect(log.value).toBe('1');
				}
			});
		});

		describe('Verify createMany action hook run', () => {
			it.each(vendors)('%s', async (vendor) => {
				// Action
				const response = await request(getUrl(vendor))
					.get('/items/tests_extensions_log')
					.query({
						filter: JSON.stringify({
							key: {
								_starts_with: `action-verify-create/${collectionArtists}_${pkType}/many`,
							},
						}),
					})
					.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

				// Assert
				expect(response.statusCode).toBe(200);
				expect(response.body.data.length).toBe(10);

				for (const log of response.body.data) {
					expect(log.value).toBe('1');
				}
			});
		});

		describe('Logical Filters', () => {
			describe('retrieves artists with name equality _AND company equality', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Setup
					const count = 6;
					const artistName = 'logical-filter-and';
					const artistCompany = 'and-equality';
					const artists = [];

					for (let i = 0; i < count; i++) {
						const artist = createArtist(pkType);
						artist.name = artistName;
						artist.company = artistCompany;
						artists.push(artist);
					}

					await CreateItem(vendor, { collection: localCollectionArtists, item: artists });

					// Action
					const response = await request(getUrl(vendor))
						.get(`/items/${localCollectionArtists}`)
						.query({
							filter: JSON.stringify({
								_and: [{ name: { _eq: artistName } }, { company: { _eq: artistCompany } }],
							}),
						})
						.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

					const gqlResponse = await requestGraphQL(getUrl(vendor), false, common.USER.ADMIN.TOKEN, {
						query: {
							[localCollectionArtists]: {
								__args: {
									filter: {
										_and: [{ name: { _eq: artistName } }, { company: { _eq: artistCompany } }],
									},
								},
								id: true,
							},
						},
					});

					// Assert
					expect(response.statusCode).toBe(200);
					expect(response.body.data.length).toBe(count);

					expect(gqlResponse.statusCode).toBe(200);
					expect(gqlResponse.body.data[localCollectionArtists].length).toEqual(count);
				});
			});

			describe('retrieves artists with name equality _OR company equality', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Setup
					const count = 5;
					const artistName = 'logical-filter-or';
					const artistCompany = 'or-equality';
					const artists1 = [];
					const artists2 = [];

					for (let i = 0; i < count; i++) {
						const artist = createArtist(pkType);
						artist.name = artistName;
						artists1.push(artist);
					}

					await CreateItem(vendor, { collection: localCollectionArtists, item: artists1 });

					for (let i = 0; i < count; i++) {
						const artist = createArtist(pkType);
						artist.company = artistCompany;
						artists2.push(artist);
					}

					await CreateItem(vendor, { collection: localCollectionArtists, item: artists2 });

					// Action
					const response = await request(getUrl(vendor))
						.get(`/items/${localCollectionArtists}`)
						.query({
							filter: JSON.stringify({
								_or: [{ name: { _eq: artistName } }, { company: { _eq: artistCompany } }],
							}),
						})
						.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

					const gqlResponse = await requestGraphQL(getUrl(vendor), false, common.USER.ADMIN.TOKEN, {
						query: {
							[localCollectionArtists]: {
								__args: {
									filter: {
										_or: [{ name: { _eq: artistName } }, { company: { _eq: artistCompany } }],
									},
								},
								id: true,
							},
						},
					});

					// Assert
					expect(response.statusCode).toBe(200);
					expect(response.body.data.length).toBe(count * 2);

					expect(gqlResponse.statusCode).toBe(200);
					expect(gqlResponse.body.data[localCollectionArtists].length).toEqual(count * 2);
				});
			});
		});

		describe('Aggregation Tests', () => {
			describe('retrieves count correctly', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Setup
					const count = 10;
					const artistName = 'aggregate-count';
					const artists = [];

					for (let i = 0; i < count; i++) {
						const artist = createArtist(pkType);
						artist.name = artistName;
						artists.push(artist);
					}

					await CreateItem(vendor, { collection: localCollectionArtists, item: artists });

					// Action
					const response = await request(getUrl(vendor))
						.get(`/items/${localCollectionArtists}`)
						.query({
							aggregate: {
								count: 'id',
							},
							filter: {
								name: { _eq: artistName },
							},
						})
						.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

					const queryKey = `${localCollectionArtists}_aggregated`;

					const gqlResponse = await requestGraphQL(getUrl(vendor), false, common.USER.ADMIN.TOKEN, {
						query: {
							[queryKey]: {
								__args: {
									filter: {
										name: { _eq: artistName },
									},
								},
								count: {
									id: true,
								},
							},
						},
					});

					// Assert
					expect(response.statusCode).toBe(200);
					expect(response.body.data[0].count.id == count).toBeTruthy();

					expect(gqlResponse.statusCode).toBe(200);
					expect(gqlResponse.body.data[queryKey][0].count.id).toEqual(count);
				});
			});
		});

		describe('Offset Tests', () => {
			describe('retrieves offset correctly', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Setup
					const count = 7;
					const offset = 3;
					const artistName = 'offset-test';
					const artists = [];

					for (let i = 0; i < count; i++) {
						const artist = createArtist(pkType);
						artist.name = artistName;
						artists.push(artist);
					}

					await CreateItem(vendor, { collection: localCollectionArtists, item: artists });

					// Action
					const response = await request(getUrl(vendor))
						.get(`/items/${localCollectionArtists}`)
						.query({
							filter: JSON.stringify({
								name: { _eq: artistName },
							}),
							offset,
						})
						.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

					const gqlResponse = await requestGraphQL(getUrl(vendor), false, common.USER.ADMIN.TOKEN, {
						query: {
							[localCollectionArtists]: {
								__args: {
									filter: {
										name: { _eq: artistName },
									},
									offset,
								},
								id: true,
							},
						},
					});

					// Assert
					expect(response.statusCode).toBe(200);
					expect(response.body.data.length).toBe(count - offset);

					expect(gqlResponse.statusCode).toBe(200);
					expect(gqlResponse.body.data[localCollectionArtists].length).toEqual(count - offset);
				});
			});

			describe('retrieves offset with limit and sort correctly', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Setup
					const count = 9;
					const offset = 4;
					const limit = 3;
					const sort = 'name';
					const artistName = 'offset-limit-sort-test';
					const artists = [];
					const expectedResultAsc = Array.from(Array(count).keys()).slice(offset, offset + limit);

					const expectedResultDesc = Array.from(Array(count).keys())
						.sort((v) => -v)
						.slice(offset, offset + limit);

					for (let i = 0; i < count; i++) {
						const artist = createArtist(pkType);
						artist.name = `${i}-${artistName}`;
						artists.push(artist);
					}

					await CreateItem(vendor, { collection: localCollectionArtists, item: artists });

					// Action
					const responseAsc = await request(getUrl(vendor))
						.get(`/items/${localCollectionArtists}`)
						.query({
							filter: JSON.stringify({
								name: { _contains: artistName },
							}),
							offset,
							limit,
							sort,
						})
						.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

					const gqlResponseAsc = await requestGraphQL(getUrl(vendor), false, common.USER.ADMIN.TOKEN, {
						query: {
							[localCollectionArtists]: {
								__args: {
									filter: {
										name: { _contains: artistName },
									},
									offset,
									limit,
									sort,
								},
								id: true,
								name: true,
							},
						},
					});

					const responseDesc = await request(getUrl(vendor))
						.get(`/items/${localCollectionArtists}`)
						.query({
							filter: JSON.stringify({
								name: { _contains: artistName },
							}),
							offset,
							limit,
							sort: `-${sort}`,
						})
						.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

					const gqlResponseDesc = await requestGraphQL(getUrl(vendor), false, common.USER.ADMIN.TOKEN, {
						query: {
							[localCollectionArtists]: {
								__args: {
									filter: {
										name: { _contains: artistName },
									},
									offset,
									limit,
									sort: `-${sort}`,
								},
								id: true,
								name: true,
							},
						},
					});

					// Assert
					expect(responseAsc.statusCode).toBe(200);
					expect(responseAsc.body.data.length).toBe(limit);
					expect(responseAsc.body.data.map((v: any) => parseInt(v.name.split('-')[0]))).toEqual(expectedResultAsc);

					expect(gqlResponseAsc.statusCode).toBe(200);
					expect(gqlResponseAsc.body.data[localCollectionArtists].length).toEqual(limit);

					expect(
						gqlResponseAsc.body.data[localCollectionArtists].map((v: any) => parseInt(v.name.split('-')[0]))
					).toEqual(expectedResultAsc);

					expect(responseDesc.statusCode).toBe(200);
					expect(responseDesc.body.data.length).toBe(limit);
					expect(responseDesc.body.data.map((v: any) => parseInt(v.name.split('-')[0]))).toEqual(expectedResultDesc);

					expect(gqlResponseDesc.statusCode).toBe(200);
					expect(gqlResponseDesc.body.data[localCollectionArtists].length).toEqual(limit);

					expect(
						gqlResponseDesc.body.data[localCollectionArtists].map((v: any) => parseInt(v.name.split('-')[0]))
					).toEqual(expectedResultDesc);
				});
			});

			describe('retrieves offset in aggregation with limit correctly', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Setup
					const count = 10;
					const offset = 3;
					const limit = 3;
					const groupBy = ['id', 'name'];
					const artistName = 'offset-aggregation-limit-test';
					const artists = [];

					for (let i = 0; i < count; i++) {
						const artist = createArtist(pkType);
						artist.name = `${i}-${artistName}`;
						artists.push(artist);
					}

					await CreateItem(vendor, { collection: localCollectionArtists, item: artists });

					// Action
					const response = await request(getUrl(vendor))
						.get(`/items/${localCollectionArtists}`)
						.query({
							aggregate: {
								count: 'id',
							},
							filter: JSON.stringify({
								name: { _contains: artistName },
							}),
							offset,
							limit,
							groupBy,
						})
						.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

					const queryKey = `${localCollectionArtists}_aggregated`;

					const gqlResponse = await requestGraphQL(getUrl(vendor), false, common.USER.ADMIN.TOKEN, {
						query: {
							[queryKey]: {
								__args: {
									filter: {
										name: { _contains: artistName },
									},
									offset,
									limit,
									groupBy,
								},
								count: {
									id: true,
								},
								group: true,
							},
						},
					});

					const response2 = await request(getUrl(vendor))
						.get(`/items/${localCollectionArtists}`)
						.query({
							aggregate: {
								count: 'id',
							},
							filter: JSON.stringify({
								name: { _contains: artistName },
							}),
							offset: offset * 2,
							limit,
							groupBy,
						})
						.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

					const gqlResponse2 = await requestGraphQL(getUrl(vendor), false, common.USER.ADMIN.TOKEN, {
						query: {
							[queryKey]: {
								__args: {
									filter: {
										name: { _contains: artistName },
									},
									offset: offset * 2,
									limit,
									groupBy,
								},
								count: {
									id: true,
								},
								group: true,
							},
						},
					});

					// Assert
					expect(response.statusCode).toBe(200);
					expect(response.body.data.length).toBe(limit);

					expect(gqlResponse.statusCode).toBe(200);
					expect(gqlResponse.body.data[queryKey].length).toEqual(limit);

					expect(response2.statusCode).toBe(200);
					expect(response2.body.data.length).toBe(limit);

					expect(gqlResponse2.statusCode).toBe(200);
					expect(gqlResponse2.body.data[queryKey].length).toEqual(limit);

					for (const item of response.body.data) {
						expect(response2.body.data).not.toContain(item);
					}

					const gqlResults = gqlResponse.body.data[queryKey].map((v: any) => v.group.id);
					const gqlResults2 = gqlResponse2.body.data[queryKey].map((v: any) => v.group.id);

					for (const item of gqlResults) {
						expect(gqlResults2).not.toContain(item);
					}
				});
			});

			describe('retrieves offset in aggregation with limit and sort correctly', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Setup
					const count = 10;
					const offset = 3;
					const limit = 6;
					const sort = 'name';
					const groupBy = ['id', 'name'];
					const artistName = 'offset-aggregation-limit-sort-test';
					const artists = [];
					const expectedResultAsc = Array.from(Array(count).keys()).slice(offset, offset + limit);

					const expectedResultDesc = Array.from(Array(count).keys())
						.sort((v) => -v)
						.slice(offset, offset + limit);

					for (let i = 0; i < count; i++) {
						const artist = createArtist(pkType);
						artist.name = `${i}-${artistName}`;
						artists.push(artist);
					}

					await CreateItem(vendor, { collection: localCollectionArtists, item: artists });

					// Action
					const responseAsc = await request(getUrl(vendor))
						.get(`/items/${localCollectionArtists}`)
						.query({
							aggregate: {
								count: 'id',
							},
							filter: JSON.stringify({
								name: { _contains: artistName },
							}),
							offset,
							limit,
							sort,
							groupBy,
						})
						.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

					const queryKey = `${localCollectionArtists}_aggregated`;

					const gqlResponseAsc = await requestGraphQL(getUrl(vendor), false, common.USER.ADMIN.TOKEN, {
						query: {
							[queryKey]: {
								__args: {
									filter: {
										name: { _contains: artistName },
									},
									offset,
									limit,
									sort,
									groupBy,
								},
								count: {
									id: true,
								},
								group: true,
							},
						},
					});

					const responseDesc = await request(getUrl(vendor))
						.get(`/items/${localCollectionArtists}`)
						.query({
							aggregate: {
								count: 'id',
							},
							filter: JSON.stringify({
								name: { _contains: artistName },
							}),
							offset,
							limit,
							sort: `-${sort}`,
							groupBy,
						})
						.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

					const gqlResponseDesc = await requestGraphQL(getUrl(vendor), false, common.USER.ADMIN.TOKEN, {
						query: {
							[queryKey]: {
								__args: {
									filter: {
										name: { _contains: artistName },
									},
									offset,
									limit,
									sort: `-${sort}`,
									groupBy,
								},
								count: {
									id: true,
								},
								group: true,
							},
						},
					});

					// Assert
					expect(responseAsc.statusCode).toBe(200);
					expect(responseAsc.body.data.length).toBe(limit);
					expect(responseAsc.body.data.map((v: any) => parseInt(v.name.split('-')[0]))).toEqual(expectedResultAsc);

					expect(gqlResponseAsc.statusCode).toBe(200);
					expect(gqlResponseAsc.body.data[queryKey].length).toEqual(limit);

					expect(gqlResponseAsc.body.data[queryKey].map((v: any) => parseInt(v.group.name.split('-')[0]))).toEqual(
						expectedResultAsc
					);

					expect(responseDesc.statusCode).toBe(200);
					expect(responseDesc.body.data.length).toBe(limit);
					expect(responseDesc.body.data.map((v: any) => parseInt(v.name.split('-')[0]))).toEqual(expectedResultDesc);

					expect(gqlResponseDesc.statusCode).toBe(200);
					expect(gqlResponseDesc.body.data[queryKey].length).toEqual(limit);

					expect(gqlResponseDesc.body.data[queryKey].map((v: any) => parseInt(v.group.name.split('-')[0]))).toEqual(
						expectedResultDesc
					);
				});
			});
		});

		describe('MAX_BATCH_MUTATION Tests', () => {
			describe('createMany', () => {
				describe('passes when below limit', () => {
					it.each(vendors)(
						'%s',
						async (vendor) => {
							// Setup
							const count = Number(config.envs[vendor].MAX_BATCH_MUTATION);
							const artists = [];
							const artists2 = [];

							for (let i = 0; i < count; i++) {
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
										id: true,
									},
								},
							});

							// Assert
							expect(response.statusCode).toBe(200);
							expect(response.body.data.length).toBe(count);

							expect(gqlResponse.statusCode).toBe(200);
							expect(gqlResponse.body.data[mutationKey].length).toEqual(count);
						},
						120000
					);
				});

				describe('errors when above limit', () => {
					it.each(vendors)(
						'%s',
						async (vendor) => {
							// Setup
							const count = Number(config.envs[vendor].MAX_BATCH_MUTATION) + 1;
							const artists = [];
							const artists2 = [];

							for (let i = 0; i < count; i++) {
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
										id: true,
									},
								},
							});

							// Assert
							expect(response.statusCode).toBe(400);
							expect(response.body.errors).toBeDefined();

							expect(response.body.errors[0].message).toBe(
								`Exceeded max batch mutation limit of ${config.envs[vendor].MAX_BATCH_MUTATION}.`
							);

							expect(gqlResponse.statusCode).toBe(200);
							expect(gqlResponse.body.errors).toBeDefined();

							expect(gqlResponse.body.errors[0].message).toBe(
								`Exceeded max batch mutation limit of ${config.envs[vendor].MAX_BATCH_MUTATION}.`
							);
						},
						120000
					);
				});
			});

			describe('updateBatch', () => {
				describe('passes when below limit', () => {
					it.each(vendors)(
						'%s',
						async (vendor) => {
							// Setup
							const count = Number(config.envs[vendor].MAX_BATCH_MUTATION);
							const artists = [];
							const artists2 = [];

							for (let i = 0; i < count; i++) {
								artists.push(
									await CreateItem(vendor, { collection: localCollectionArtists, item: createArtist(pkType) })
								);

								artists2.push(
									await CreateItem(vendor, { collection: localCollectionArtists, item: createArtist(pkType) })
								);
							}

							// Action
							const response = await request(getUrl(vendor))
								.patch(`/items/${localCollectionArtists}`)
								.send(artists)
								.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

							const mutationKey = `update_${localCollectionArtists}_batch`;

							const gqlResponse = await requestGraphQL(getUrl(vendor), false, common.USER.ADMIN.TOKEN, {
								mutation: {
									[mutationKey]: {
										__args: {
											data: artists2,
										},
										id: true,
									},
								},
							});

							// Assert
							expect(response.statusCode).toBe(200);
							expect(response.body.data.length).toBe(count);

							expect(gqlResponse.statusCode).toBe(200);
							expect(gqlResponse.body.data[mutationKey].length).toEqual(count);
						},
						120000
					);
				});

				describe('errors when above limit', () => {
					it.each(vendors)(
						'%s',
						async (vendor) => {
							// Setup
							const count = Number(config.envs[vendor].MAX_BATCH_MUTATION) + 1;
							const artists = [];
							const artists2 = [];

							for (let i = 0; i < count; i++) {
								artists.push(
									await CreateItem(vendor, { collection: localCollectionArtists, item: createArtist(pkType) })
								);

								artists2.push(
									await CreateItem(vendor, { collection: localCollectionArtists, item: createArtist(pkType) })
								);
							}

							// Action
							const response = await request(getUrl(vendor))
								.patch(`/items/${localCollectionArtists}`)
								.send(artists)
								.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

							const mutationKey = `update_${localCollectionArtists}_batch`;

							const gqlResponse = await requestGraphQL(getUrl(vendor), false, common.USER.ADMIN.TOKEN, {
								mutation: {
									[mutationKey]: {
										__args: {
											data: artists2,
										},
										id: true,
									},
								},
							});

							// Assert
							expect(response.statusCode).toBe(400);
							expect(response.body.errors).toBeDefined();

							expect(response.body.errors[0].message).toBe(
								`Exceeded max batch mutation limit of ${config.envs[vendor].MAX_BATCH_MUTATION}.`
							);

							expect(gqlResponse.statusCode).toBe(200);
							expect(gqlResponse.body.errors).toBeDefined();

							expect(gqlResponse.body.errors[0].message).toBe(
								`Exceeded max batch mutation limit of ${config.envs[vendor].MAX_BATCH_MUTATION}.`
							);
						},
						120000
					);
				});
			});

			describe('updateMany', () => {
				describe('passes when below limit', () => {
					it.each(vendors)(
						'%s',
						async (vendor) => {
							// Setup
							const count = Number(config.envs[vendor].MAX_BATCH_MUTATION);
							const artistIDs = [];
							const artistIDs2 = [];

							for (let i = 0; i < count; i++) {
								artistIDs.push(
									(await CreateItem(vendor, { collection: localCollectionArtists, item: createArtist(pkType) })).id
								);

								artistIDs2.push(
									(await CreateItem(vendor, { collection: localCollectionArtists, item: createArtist(pkType) })).id
								);
							}

							// Action
							const response = await request(getUrl(vendor))
								.patch(`/items/${localCollectionArtists}`)
								.send({ keys: artistIDs, data: { name: 'updated' } })
								.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

							const mutationKey = `update_${localCollectionArtists}_items`;

							const gqlResponse = await requestGraphQL(getUrl(vendor), false, common.USER.ADMIN.TOKEN, {
								mutation: {
									[mutationKey]: {
										__args: {
											ids: artistIDs2,
											data: { name: 'updated' },
										},
										id: true,
									},
								},
							});

							// Assert
							expect(response.statusCode).toBe(200);
							expect(response.body.data.length).toBe(count);

							expect(gqlResponse.statusCode).toBe(200);
							expect(gqlResponse.body.data[mutationKey].length).toEqual(count);
						},
						120000
					);
				});

				describe('errors when above limit', () => {
					it.each(vendors)(
						'%s',
						async (vendor) => {
							// Setup
							const count = Number(config.envs[vendor].MAX_BATCH_MUTATION) + 1;
							const artistIDs = [];
							const artistIDs2 = [];

							for (let i = 0; i < count; i++) {
								artistIDs.push(
									(await CreateItem(vendor, { collection: localCollectionArtists, item: createArtist(pkType) })).id
								);

								artistIDs2.push(
									(await CreateItem(vendor, { collection: localCollectionArtists, item: createArtist(pkType) })).id
								);
							}

							// Action
							const response = await request(getUrl(vendor))
								.patch(`/items/${localCollectionArtists}`)
								.send({ keys: artistIDs, data: { name: 'updated' } })
								.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

							const mutationKey = `update_${localCollectionArtists}_items`;

							const gqlResponse = await requestGraphQL(getUrl(vendor), false, common.USER.ADMIN.TOKEN, {
								mutation: {
									[mutationKey]: {
										__args: {
											ids: artistIDs2,
											data: { name: 'updated' },
										},
										id: true,
									},
								},
							});

							// Assert
							expect(response.statusCode).toBe(400);
							expect(response.body.errors).toBeDefined();

							expect(response.body.errors[0].message).toBe(
								`Exceeded max batch mutation limit of ${config.envs[vendor].MAX_BATCH_MUTATION}.`
							);

							expect(gqlResponse.statusCode).toBe(200);
							expect(gqlResponse.body.errors).toBeDefined();

							expect(gqlResponse.body.errors[0].message).toBe(
								`Exceeded max batch mutation limit of ${config.envs[vendor].MAX_BATCH_MUTATION}.`
							);
						},
						120000
					);
				});
			});

			describe('updateByQuery', () => {
				describe('passes when below limit', () => {
					it.each(vendors)(
						'%s',
						async (vendor) => {
							// Setup
							const count = Number(config.envs[vendor].MAX_BATCH_MUTATION);
							const company = uuid();

							for (let i = 0; i < count; i++) {
								const artist = createArtist(pkType);
								artist.company = company;
								await CreateItem(vendor, { collection: localCollectionArtists, item: artist });
							}

							// Action
							const response = await request(getUrl(vendor))
								.patch(`/items/${localCollectionArtists}`)
								.send({
									query: {
										filter: JSON.stringify({ company: { _eq: company } }),
										limit: -1,
									},
									data: { name: 'updated' },
								})
								.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

							// Assert
							expect(response.statusCode).toBe(200);
							expect(response.body.data.length).toBe(count);
						},
						120000
					);
				});

				describe('errors when above limit', () => {
					it.each(vendors)(
						'%s',
						async (vendor) => {
							// Setup
							const count = Number(config.envs[vendor].MAX_BATCH_MUTATION) + 1;
							const company = uuid();

							for (let i = 0; i < count; i++) {
								const artist = createArtist(pkType);
								artist.company = company;
								await CreateItem(vendor, { collection: localCollectionArtists, item: artist });
							}

							// Action
							const response = await request(getUrl(vendor))
								.patch(`/items/${localCollectionArtists}`)
								.send({
									query: {
										filter: JSON.stringify({ company: { _eq: company } }),
										limit: -1,
									},
									data: { name: 'updated' },
								})
								.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

							// Assert
							expect(response.statusCode).toBe(400);
							expect(response.body.errors).toBeDefined();

							expect(response.body.errors[0].message).toBe(
								`Exceeded max batch mutation limit of ${config.envs[vendor].MAX_BATCH_MUTATION}.`
							);
						},
						120000
					);
				});
			});

			describe('deleteMany', () => {
				describe('passes when below limit', () => {
					it.each(vendors)(
						'%s',
						async (vendor) => {
							// Setup
							const count = Number(config.envs[vendor].MAX_BATCH_MUTATION);
							const artistIDs = [];
							const artistIDs2 = [];
							const artistIDs3 = [];
							const artistIDs4 = [];

							for (let i = 0; i < count; i++) {
								artistIDs.push(
									(await CreateItem(vendor, { collection: localCollectionArtists, item: createArtist(pkType) })).id
								);

								artistIDs2.push(
									(await CreateItem(vendor, { collection: localCollectionArtists, item: createArtist(pkType) })).id
								);

								artistIDs3.push(
									(await CreateItem(vendor, { collection: localCollectionArtists, item: createArtist(pkType) })).id
								);

								artistIDs4.push(
									(await CreateItem(vendor, { collection: localCollectionArtists, item: createArtist(pkType) })).id
								);
							}

							// Action
							const response = await request(getUrl(vendor))
								.delete(`/items/${localCollectionArtists}`)
								.send({ keys: artistIDs })
								.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

							const response2 = await request(getUrl(vendor))
								.delete(`/items/${localCollectionArtists}`)
								.send({ keys: artistIDs2 })
								.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

							const mutationKey = `delete_${localCollectionArtists}_items`;

							const gqlResponse = await requestGraphQL(getUrl(vendor), false, common.USER.ADMIN.TOKEN, {
								mutation: {
									[mutationKey]: {
										__args: {
											ids: artistIDs3,
										},
										ids: true,
									},
								},
							});

							const gqlResponse2 = await requestGraphQL(getUrl(vendor), false, common.USER.ADMIN.TOKEN, {
								mutation: {
									[mutationKey]: {
										__args: {
											ids: artistIDs4,
										},
										ids: true,
									},
								},
							});

							// Assert
							expect(response.statusCode).toBe(204);

							expect(response2.statusCode).toBe(204);

							expect(gqlResponse.statusCode).toBe(200);
							expect(gqlResponse.body.data[mutationKey].ids.length).toEqual(count);

							expect(gqlResponse2.statusCode).toBe(200);
							expect(gqlResponse2.body.data[mutationKey].ids.length).toEqual(count);
						},
						120000
					);
				});

				describe('errors when above limit', () => {
					it.each(vendors)(
						'%s',
						async (vendor) => {
							// Setup
							const count = Number(config.envs[vendor].MAX_BATCH_MUTATION) + 1;
							const artistIDs = [];
							const artistIDs2 = [];
							const artistIDs3 = [];
							const artistIDs4 = [];

							for (let i = 0; i < count; i++) {
								artistIDs.push(
									(await CreateItem(vendor, { collection: localCollectionArtists, item: createArtist(pkType) })).id
								);

								artistIDs2.push(
									(await CreateItem(vendor, { collection: localCollectionArtists, item: createArtist(pkType) })).id
								);

								artistIDs3.push(
									(await CreateItem(vendor, { collection: localCollectionArtists, item: createArtist(pkType) })).id
								);

								artistIDs4.push(
									(await CreateItem(vendor, { collection: localCollectionArtists, item: createArtist(pkType) })).id
								);
							}

							// Action
							const response = await request(getUrl(vendor))
								.delete(`/items/${localCollectionArtists}`)
								.send({ keys: artistIDs })
								.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

							const response2 = await request(getUrl(vendor))
								.delete(`/items/${localCollectionArtists}`)
								.send({ keys: artistIDs2 })
								.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

							const mutationKey = `delete_${localCollectionArtists}_items`;

							const gqlResponse = await requestGraphQL(getUrl(vendor), false, common.USER.ADMIN.TOKEN, {
								mutation: {
									[mutationKey]: {
										__args: {
											ids: artistIDs3,
										},
										ids: true,
									},
								},
							});

							const gqlResponse2 = await requestGraphQL(getUrl(vendor), false, common.USER.ADMIN.TOKEN, {
								mutation: {
									[mutationKey]: {
										__args: {
											ids: artistIDs4,
										},
										ids: true,
									},
								},
							});

							// Assert
							expect(response.statusCode).toBe(400);
							expect(response.body.errors).toBeDefined();

							expect(response.body.errors[0].message).toBe(
								`Exceeded max batch mutation limit of ${config.envs[vendor].MAX_BATCH_MUTATION}.`
							);

							expect(response2.statusCode).toBe(400);
							expect(response2.body.errors).toBeDefined();

							expect(response2.body.errors[0].message).toBe(
								`Exceeded max batch mutation limit of ${config.envs[vendor].MAX_BATCH_MUTATION}.`
							);

							expect(gqlResponse.statusCode).toBe(200);
							expect(gqlResponse.body.errors).toBeDefined();

							expect(gqlResponse.body.errors[0].message).toBe(
								`Exceeded max batch mutation limit of ${config.envs[vendor].MAX_BATCH_MUTATION}.`
							);

							expect(gqlResponse2.statusCode).toBe(200);
							expect(gqlResponse2.body.errors).toBeDefined();

							expect(gqlResponse2.body.errors[0].message).toBe(
								`Exceeded max batch mutation limit of ${config.envs[vendor].MAX_BATCH_MUTATION}.`
							);
						},
						120000
					);
				});
			});

			describe('deleteByQuery', () => {
				describe('passes when below limit', () => {
					it.each(vendors)(
						'%s',
						async (vendor) => {
							// Setup
							const count = Number(config.envs[vendor].MAX_BATCH_MUTATION);
							const company = uuid();

							for (let i = 0; i < count; i++) {
								const artist = createArtist(pkType);
								artist.company = company;
								await CreateItem(vendor, { collection: localCollectionArtists, item: artist });
							}

							// Action
							const response = await request(getUrl(vendor))
								.delete(`/items/${localCollectionArtists}`)
								.send({
									query: {
										filter: JSON.stringify({ company: { _eq: company } }),
										limit: -1,
									},
								})
								.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

							// Assert
							expect(response.statusCode).toBe(204);
						},
						120000
					);
				});

				describe('errors when above limit', () => {
					it.each(vendors)(
						'%s',
						async (vendor) => {
							// Setup
							const count = Number(config.envs[vendor].MAX_BATCH_MUTATION) + 1;
							const company = uuid();

							for (let i = 0; i < count; i++) {
								const artist = createArtist(pkType);
								artist.company = company;
								await CreateItem(vendor, { collection: localCollectionArtists, item: artist });
							}

							// Action
							const response = await request(getUrl(vendor))
								.delete(`/items/${localCollectionArtists}`)
								.send({
									query: {
										filter: JSON.stringify({ company: { _eq: company } }),
										limit: -1,
									},
								})
								.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

							// Assert
							expect(response.statusCode).toBe(400);
							expect(response.body.errors).toBeDefined();

							expect(response.body.errors[0].message).toBe(
								`Exceeded max batch mutation limit of ${config.envs[vendor].MAX_BATCH_MUTATION}.`
							);
						},
						120000
					);
				});
			});
		});
	});
});
