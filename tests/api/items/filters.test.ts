import config, { getUrl } from '../../config';
import vendors from '../../get-dbs-to-test';
import request from 'supertest';
import knex, { Knex } from 'knex';
import { createArtist, createGuest, seedTable, createMany } from '../../setup/utils/factories';
import { v4 as uuid } from 'uuid';
import { internet } from 'faker';
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
		describe('Mathmatical Operators', () => {
			describe('returns users with name _eq', () => {
				it.each(vendors)('%s', async (vendor) => {
					const name = internet.email();
					const guests: any[] = createMany(createGuest, 10);
					for (const guest of guests) {
						guest.id = uuid();
						guest.name = name;
					}
					await seedTable(databases.get(vendor)!, 1, 'guests', guests);

					const response = await request(getUrl(vendor))
						.get(`/items/guests?filter={"name": { "_eq": "${name}" }}`)
						.set('Authorization', 'Bearer AdminToken')
						.expect('Content-Type', /application\/json/)
						.expect(200);

					expect(response.body.data.length).toBe(guests.length);
					expect(response.body.data[0]).toMatchObject({
						name: name,
					});
				});
			});
			describe('returns users with name _neq', () => {
				it.each(vendors)('%s', async (vendor) => {
					const guests: any[] = createMany(createGuest, 10);
					await seedTable(databases.get(vendor)!, 1, 'guests', guests);

					const response = await request(getUrl(vendor))
						.get(`/items/guests?&filter={"name": { "_neq": "${guests[0].name}" }}`)
						.set('Authorization', 'Bearer AdminToken')
						.expect('Content-Type', /application\/json/)
						.expect(200);

					expect(Object.values(response.body.data).includes(guests[0].name)).toBeFalsy();
				});
			});
		});

		describe('Logical Operators', () => {
			describe('returns users with name equality _AND favorite_artist equality', () => {
				it.each(vendors)('%s', async (vendor) => {
					const name = internet.email();
					const guests: any[] = createMany(createGuest, 10, { name });
					await seedTable(databases.get(vendor)!, 1, 'guests', guests);
					const artist = createArtist();
					for (const guest of guests) {
						guest.id = uuid();
						guest.name = name;
						guest.favorite_artist = artist.id;
					}
					await seedTable(databases.get(vendor)!, 1, 'artists', artist);
					await seedTable(databases.get(vendor)!, 1, 'guests', guests);

					const response = await request(getUrl(vendor))
						.get(
							`/items/guests?filter={"_and":[{"name": { "_eq": "${guests[0].name}" }},{"favorite_artist": { "_eq": "${guests[0].favorite_artist}" }}]}`
						)
						.set('Authorization', 'Bearer AdminToken')
						.expect('Content-Type', /application\/json/)
						.expect(200);

					expect(response.body.data.length).toBe(guests.length);
				});
			});
			describe('returns users with name equality _OR favorite_artist equality', () => {
				it.each(vendors)('%s', async (vendor) => {
					const name = internet.email();

					const artist = createArtist();
					const guests: any[] = createMany(createGuest, 10, { name });
					await seedTable(databases.get(vendor)!, 1, 'guests', guests);

					for (const guest of guests) {
						guest.id = uuid();
						guest.name = internet.email();
						guest.favorite_artist = artist.id;
					}
					await seedTable(databases.get(vendor)!, 1, 'artists', artist);
					await seedTable(databases.get(vendor)!, 1, 'guests', guests);

					const response = await request(getUrl(vendor))
						.get(
							`/items/guests?filter={"_or":[{"name": { "_eq": "${name}" }},{"favorite_artist": { "_eq": "${artist.id}" }}]}`
						)
						.set('Authorization', 'Bearer AdminToken')
						.expect('Content-Type', /application\/json/)
						.expect(200);

					expect(response.body.data.length).toBe(20);
				});
			});

			describe('returns users with $CURRENT_USER filter', () => {
				it.each(vendors)('%s', async (vendor) => {
					const name = internet.email();
					const adminID = 'a8057636-9b70-4804-bfec-19c88d1a3273';
					const userID = 'cb8cd13b-037f-40ca-862a-ea1e1f4bfca2';

					const guests: any[] = createMany(createGuest, 15, { name });
					await seedTable(databases.get(vendor)!, 1, 'guests', guests);

					let count = 0;
					for (const guest of guests) {
						guest.id = uuid();
						guest.user_created = count < 10 ? adminID : userID;
						count++;
					}

					await seedTable(databases.get(vendor)!, 1, 'guests', guests);

					const equalResponse = await request(getUrl(vendor))
						.get(
							`/items/guests?filter={"_and":[{"name": { "_eq": "${name}" }},{"user_created": { "_eq": "$CURRENT_USER.id" }}]}`
						)
						.set('Authorization', 'Bearer AdminToken')
						.expect('Content-Type', /application\/json/)
						.expect(200);

					expect(equalResponse.body.data.length).toBe(10);

					const equalResponseNoID = await request(getUrl(vendor))
						.get(
							`/items/guests?filter={"_and":[{"name": { "_eq": "${name}" }},{"user_created": { "_eq": "$CURRENT_USER" }}]}`
						)
						.set('Authorization', 'Bearer AdminToken')
						.expect('Content-Type', /application\/json/)
						.expect(200);

					expect(equalResponseNoID.body.data.length).toBe(10);

					const notEqualResponse = await request(getUrl(vendor))
						.get(
							`/items/guests?filter={"_and":[{"name": { "_eq": "${name}" }},{"user_created": { "_neq": "$CURRENT_USER.id" }}]}`
						)
						.set('Authorization', 'Bearer AdminToken')
						.expect('Content-Type', /application\/json/)
						.expect(200);

					expect(notEqualResponse.body.data.length).toBe(5);

					const notEqualResponseNoID = await request(getUrl(vendor))
						.get(
							`/items/guests?filter={"_and":[{"name": { "_eq": "${name}" }},{"user_created": { "_neq": "$CURRENT_USER" }}]}`
						)
						.set('Authorization', 'Bearer AdminToken')
						.expect('Content-Type', /application\/json/)
						.expect(200);

					expect(notEqualResponseNoID.body.data.length).toBe(5);
				});
			});

			describe('returns users with $CURRENT_ROLE filter', () => {
				it.each(vendors)('%s', async (vendor) => {
					const name = internet.email();
					const adminRoleID = '5b935e65-d3db-4457-96f1-597e2fcfc7f3';
					const userRoleID = '214faee7-d6a6-4a4c-b1cd-f9e9bd0b6fb7';

					const guests: any[] = createMany(createGuest, 15, { name });
					await seedTable(databases.get(vendor)!, 1, 'guests', guests);

					let count = 0;
					for (const guest of guests) {
						guest.id = uuid();
						guest.user_role = count < 10 ? adminRoleID : userRoleID;
						count++;
					}

					await seedTable(databases.get(vendor)!, 1, 'guests', guests);

					const equalResponse = await request(getUrl(vendor))
						.get(
							`/items/guests?filter={"_and":[{"name": { "_eq": "${name}" }},{"user_role": { "_eq": "$CURRENT_ROLE.id" }}]}`
						)
						.set('Authorization', 'Bearer AdminToken')
						.expect('Content-Type', /application\/json/)
						.expect(200);

					expect(equalResponse.body.data.length).toBe(10);

					const equalResponseNoID = await request(getUrl(vendor))
						.get(
							`/items/guests?filter={"_and":[{"name": { "_eq": "${name}" }},{"user_role": { "_eq": "$CURRENT_ROLE" }}]}`
						)
						.set('Authorization', 'Bearer AdminToken')
						.expect('Content-Type', /application\/json/)
						.expect(200);

					expect(equalResponseNoID.body.data.length).toBe(10);

					const notEqualResponse = await request(getUrl(vendor))
						.get(
							`/items/guests?filter={"_and":[{"name": { "_eq": "${name}" }},{"user_role": { "_neq": "$CURRENT_ROLE.id" }}]}`
						)
						.set('Authorization', 'Bearer AdminToken')
						.expect('Content-Type', /application\/json/)
						.expect(200);

					expect(notEqualResponse.body.data.length).toBe(5);

					const notEqualResponseNoID = await request(getUrl(vendor))
						.get(
							`/items/guests?filter={"_and":[{"name": { "_eq": "${name}" }},{"user_role": { "_neq": "$CURRENT_ROLE" }}]}`
						)
						.set('Authorization', 'Bearer AdminToken')
						.expect('Content-Type', /application\/json/)
						.expect(200);

					expect(notEqualResponseNoID.body.data.length).toBe(5);
				});
			});
		});
	});
});
