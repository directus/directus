import knex, { Knex } from 'knex';
import request from 'supertest';
import { v4 as uuid } from 'uuid';
import config, { getUrl } from '../../config';
import vendors from '../../get-dbs-to-test';
import { createArtist, createGuest, createMany, seedTable } from '../../setup/utils/factories';

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
		describe('Mathematical Operators', () => {
			describe('returns users with name _eq', () => {
				it.each(vendors)('%s', async (vendor) => {
					const name = 'users-with-eq@example.com';
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
			describe('returns guest that contains "contains" case insensitive', () => {
				it.each(vendors)('%s', async (vendor) => {
					const guest = createGuest();

					const name = 'testing-ContAIns-insensitive@example.com';
					guest.name = name;

					await seedTable(databases.get(vendor)!, 1, 'guests', guest);

					const response = await request(getUrl(vendor))
						.get(`/items/guests?filter={{"name":{"_icontains":"contains"}}`)
						.set('Authorization', 'Bearer AdminToken')
						.expect('Content-Type', /application\/json/)
						.expect(200);

					expect(Object.values(response.body.data).includes(guest.name)).toBeTruthy();
				});
			});
			describe('returns guest that do not contain "contains" case insensitive', () => {
				it.each(vendors)('%s', async (vendor) => {
					const guest = createGuest();

					const name = 'testing-does-not-contain-InSeNsiTiVe@example.com';
					guest.name = name;

					await seedTable(databases.get(vendor)!, 1, 'guests', guest);

					const response = await request(getUrl(vendor))
						.get(`/items/guests?filter={{"name":{"_nicontains":"insensitive"}}`)
						.set('Authorization', 'Bearer AdminToken')
						.expect('Content-Type', /application\/json/)
						.expect(200);

					expect(Object.values(response.body.data).includes(guest.name)).toBeFalsy();
				});
			});
			describe('returns guest that ends with "ends_with" case insensitive', () => {
				it.each(vendors)('%s', async (vendor) => {
					const guest = createGuest();

					const name = 'testing-ends_with-insensitive@enDS_wITH.com';
					guest.name = name;

					await seedTable(databases.get(vendor)!, 1, 'guests', guest);

					const response = await request(getUrl(vendor))
						.get(`/items/guests?filter={{"name":{"_iends_with":"ends_with.com"}}`)
						.set('Authorization', 'Bearer AdminToken')
						.expect('Content-Type', /application\/json/)
						.expect(200);

					expect(response.body.data.length).toBe(1);
				});
			});

			describe('returns guest that does not end with "ends_with" case insensitive', () => {
				it.each(vendors)('%s', async (vendor) => {
					const guest = createGuest();

					const name = 'testing-ends_with-insensitive@enDS_wITH.com';
					guest.name = name;

					await seedTable(databases.get(vendor)!, 1, 'guests', guest);

					const response = await request(getUrl(vendor))
						.get(`/items/guests?filter={{"name":{"_niends_with":"ends_with.com"}}`)
						.set('Authorization', 'Bearer AdminToken')
						.expect('Content-Type', /application\/json/)
						.expect(200);

					expect(Object.values(response.body.data).includes(guest.name)).toBeFalsy();
				});
			});
			describe('returns guest that equal "insensitive" case insensitive', () => {
				it.each(vendors)('%s', async (vendor) => {
					const guest = createGuest();

					const name = 'testing-equals-InSeNsiTiVe@example.com';
					guest.name = name;

					await seedTable(databases.get(vendor)!, 1, 'guests', guest);

					const response = await request(getUrl(vendor))
						.get(`/items/guests?filter={{"name":{"_ieq":"insensitive"}}`)
						.set('Authorization', 'Bearer AdminToken')
						.expect('Content-Type', /application\/json/)
						.expect(200);

					expect(Object.values(response.body.data).includes(guest.name)).toBeTruthy();
				});
			});
			describe('returns guest that do not equal "insensitive" case insensitive', () => {
				it.each(vendors)('%s', async (vendor) => {
					const guest = createGuest();

					const name = 'testing-does-not-equal-InSeNsiTiVe@example.com';
					guest.name = name;

					await seedTable(databases.get(vendor)!, 1, 'guests', guest);

					const response = await request(getUrl(vendor))
						.get(`/items/guests?filter={{"name":{"_nieq":"insensitive"}}`)
						.set('Authorization', 'Bearer AdminToken')
						.expect('Content-Type', /application\/json/)
						.expect(200);

					expect(Object.values(response.body.data).includes(guest.name)).toBeFalsy();
				});
			});
			describe('returns guest that start with "insensitive" case insensitive', () => {
				it.each(vendors)('%s', async (vendor) => {
					const guest = createGuest();

					const name = 'insenSITive-testing-starts_with@example.com';
					guest.name = name;

					await seedTable(databases.get(vendor)!, 1, 'guests', guest);

					const response = await request(getUrl(vendor))
						.get(`/items/guests?filter={{"name":{"_istarts_with":"insensitive"}}`)
						.set('Authorization', 'Bearer AdminToken')
						.expect('Content-Type', /application\/json/)
						.expect(200);

					expect(Object.values(response.body.data).includes(guest.name)).toBeTruthy();
				});
			});
			describe('returns guest that do not start with "insensitive" case insensitive', () => {
				it.each(vendors)('%s', async (vendor) => {
					const guest = createGuest();

					const name = 'insenSITive-testing-not-start-with@example.com';
					guest.name = name;

					await seedTable(databases.get(vendor)!, 1, 'guests', guest);

					const response = await request(getUrl(vendor))
						.get(`/items/guests?filter={{"name":{"_nistarts_with":"insensitive"}}`)
						.set('Authorization', 'Bearer AdminToken')
						.expect('Content-Type', /application\/json/)
						.expect(200);

					expect(Object.values(response.body.data).includes(guest.name)).toBeFalsy();
				});
			});
			describe('returns guest that equal "insensitive" case insensitive', () => {
				it.each(vendors)('%s', async (vendor) => {
					const guest = createGuest();

					const name = 'testing-equals-InSeNsiTiVe@example.com';
					guest.name = name;

					await seedTable(databases.get(vendor)!, 1, 'guests', guest);

					const response = await request(getUrl(vendor))
						.get(`/items/guests?filter={{"name":{"_ieq":"insensitive"}}`)
						.set('Authorization', 'Bearer AdminToken')
						.expect('Content-Type', /application\/json/)
						.expect(200);

					expect(Object.values(response.body.data).includes(guest.name)).toBeTruthy();
				});
			});
			describe('returns guest that do not equal "insensitive" case insensitive', () => {
				it.each(vendors)('%s', async (vendor) => {
					const guest = createGuest();

					const name = 'testing-does-not-equal-InSeNsiTiVe@example.com';
					guest.name = name;

					await seedTable(databases.get(vendor)!, 1, 'guests', guest);

					const response = await request(getUrl(vendor))
						.get(`/items/guests?filter={{"name":{"_nieq":"insensitive"}}`)
						.set('Authorization', 'Bearer AdminToken')
						.expect('Content-Type', /application\/json/)
						.expect(200);

					expect(Object.values(response.body.data).includes(guest.name)).toBeFalsy();
				});
			});

			//
			//
			//

			describe('returns guest that contains "contains"', () => {
				it.each(vendors)('%s', async (vendor) => {
					const guest = createGuest();
					const iguest = createGuest();

					guest.name = 'testing-contains-case-sensitive@example.com';
					iguest.name = 'testing-contains-CASE-insensitive@example.com';

					await seedTable(databases.get(vendor)!, 1, 'guests', guest);
					await seedTable(databases.get(vendor)!, 1, 'guests', iguest);

					const response = await request(getUrl(vendor))
						.get(`/items/guests?filter={{"name":{"_contains":"contains-case"}}`)
						.set('Authorization', 'Bearer AdminToken')
						.expect('Content-Type', /application\/json/)
						.expect(200);

					expect(Object.values(response.body.data).includes(guest.name)).toBeTruthy();
					expect(Object.values(response.body.data).includes(iguest.name)).toBeFalsy();
				});
			});
			describe('returns guest that do not contain "sensitive" case insensitive', () => {
				it.each(vendors)('%s', async (vendor) => {
					const guest = createGuest();
					const iguest = createGuest();

					guest.name = 'testing-does-not-contain-sensitive@example.com';
					iguest.name = 'testing-does-not-contain-inSENsitive@example.com';

					await seedTable(databases.get(vendor)!, 1, 'guests', guest);
					await seedTable(databases.get(vendor)!, 1, 'guests', iguest);

					const response = await request(getUrl(vendor))
						.get(`/items/guests?filter={{"name":{"_ncontains":"sensitive"}}`)
						.set('Authorization', 'Bearer AdminToken')
						.expect('Content-Type', /application\/json/)
						.expect(200);

					expect(Object.values(response.body.data).includes(guest.name)).toBeTruthy();
					expect(Object.values(response.body.data).includes(iguest.name)).toBeFalsy();
				});
			});
			describe('returns guest that ends with "ends_with" case insensitive', () => {
				it.each(vendors)('%s', async (vendor) => {
					const iguest = createGuest();
					const guest = createGuest();

					iguest.name = 'testing-ends_with-insensitive@enDS_wITH.com';
					guest.name = 'testing-ends_with-insensitive@ends_with.com';

					await seedTable(databases.get(vendor)!, 1, 'guests', guest);
					await seedTable(databases.get(vendor)!, 1, 'guests', iguest);

					const response = await request(getUrl(vendor))
						.get(`/items/guests?filter={{"name":{"_ends_with":"ends_with.com"}}`)
						.set('Authorization', 'Bearer AdminToken')
						.expect('Content-Type', /application\/json/)
						.expect(200);

					expect(Object.values(response.body.data).includes(guest.name)).toBeTruthy();
					expect(Object.values(response.body.data).includes(iguest.name)).toBeFalsy();
				});
			});

			describe('returns guest that does not end with "ends_with" case insensitive', () => {
				it.each(vendors)('%s', async (vendor) => {
					const guest = createGuest();
					const iguest = createGuest();

					guest.name = 'testing-ends_with-sensitive@ends_with.com';
					iguest.name = 'testing-ends_with-insensitive@enDS_wITH.com';

					await seedTable(databases.get(vendor)!, 1, 'guests', guest);
					await seedTable(databases.get(vendor)!, 1, 'guests', iguest);

					const response = await request(getUrl(vendor))
						.get(`/items/guests?filter={{"name":{"_nends_with":"ends_with.com"}}`)
						.set('Authorization', 'Bearer AdminToken')
						.expect('Content-Type', /application\/json/)
						.expect(200);

					expect(Object.values(response.body.data).includes(guest.name)).toBeFalsy();
					expect(Object.values(response.body.data).includes(iguest.name)).toBeTruthy();
				});
			});
			describe('returns guest that start with "testing" case sensitive', () => {
				it.each(vendors)('%s', async (vendor) => {
					const guest = createGuest();
					const iguest = createGuest();

					guest.name = 'testing-starts_with@example.com';
					iguest.name = 'teSTing-starts_with@example.com';

					await seedTable(databases.get(vendor)!, 1, 'guests', guest);
					await seedTable(databases.get(vendor)!, 1, 'guests', iguest);

					const response = await request(getUrl(vendor))
						.get(`/items/guests?filter={{"name":{"_starts_with":"testing"}}`)
						.set('Authorization', 'Bearer AdminToken')
						.expect('Content-Type', /application\/json/)
						.expect(200);

					expect(Object.values(response.body.data).includes(guest.name)).toBeTruthy();
					expect(Object.values(response.body.data).includes(iguest.name)).toBeFalsy();
				});
			});
			describe('returns guest that do not start with "testing" case sensitive', () => {
				it.each(vendors)('%s', async (vendor) => {
					const guest = createGuest();
					const iguest = createGuest();

					guest.name = 'testing-starts_with-sensitive@example.com';
					iguest.name = 'TESTing-starts_with-insensitive@example.com';

					await seedTable(databases.get(vendor)!, 1, 'guests', guest);
					await seedTable(databases.get(vendor)!, 1, 'guests', iguest);

					const response = await request(getUrl(vendor))
						.get(`/items/guests?filter={{"name":{"_nistarts_with":"testing"}}`)
						.set('Authorization', 'Bearer AdminToken')
						.expect('Content-Type', /application\/json/)
						.expect(200);

					expect(Object.values(response.body.data).includes(guest.name)).toBeTruthy();
					expect(Object.values(response.body.data).includes(iguest.name)).toBeFalsy();
				});
			});
		});

		describe('Logical Operators', () => {
			describe('returns users with name equality _AND favorite_artist equality', () => {
				it.each(vendors)('%s', async (vendor) => {
					const name = 'users-with-name-and-favorite-artist@example.com';
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
					const name = 'testing-name-equality@example.com';

					const artist = createArtist();
					const guests: any[] = createMany(createGuest, 10, { name });
					await seedTable(databases.get(vendor)!, 1, 'guests', guests);

					for (const guest of guests) {
						guest.id = uuid();
						guest.name = 'not-equal-test@example.com';
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
		});
	});
});
