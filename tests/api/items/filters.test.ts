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

	beforeEach(async () => {
		for (const [, connection] of databases) {
			await connection('guests').delete();
		}
	});

	describe('/:collection GET', () => {
		describe('Mathematical Operators', () => {
			describe('returns users with name _between', () => {
				it.each(vendors)('%s - from array', async (vendor) => {
					const fromShowsAttended = 1;
					const toShowsAttended = 3;

					const guests: any[] = createMany(createGuest, 10);
					for (let i = 0; i < guests.length; i++) {
						guests[i].shows_attended = i;
					}

					await seedTable(databases.get(vendor)!, 1, 'guests', guests);

					const response = await request(getUrl(vendor))
						.get(`/items/guests?filter={"shows_attended": { "_between": [${fromShowsAttended},${toShowsAttended}] }}`)
						.set('Authorization', 'Bearer AdminToken')
						.expect('Content-Type', /application\/json/)
						.expect(200);

					expect(response.body.data.length).toBe(3);
				});

				it.each(vendors)('%s - from string', async (vendor) => {
					const fromShowsAttended = 1;
					const tohowsAttended = 3;

					const guests: any[] = createMany(createGuest, 10);
					for (let i = 0; i < guests.length; i++) {
						guests[i].shows_attended = i;
					}

					await seedTable(databases.get(vendor)!, 1, 'guests', guests);

					const response = await request(getUrl(vendor))
						.get(`/items/guests?filter={"shows_attended": { "_between": "${fromShowsAttended},${tohowsAttended}" }}`)
						.set('Authorization', 'Bearer AdminToken')
						.expect('Content-Type', /application\/json/)
						.expect(200);

					expect(response.body.data.length).toBe(3);
				});
			});
			describe('returns users with name _nbetween', () => {
				it.each(vendors)('%s - from array', async (vendor) => {
					const fromShowsAttended = 1;
					const toShowsAttended = 3;

					const guests: any[] = createMany(createGuest, 10);
					for (let i = 0; i < guests.length; i++) {
						guests[i].shows_attended = i;
					}

					await seedTable(databases.get(vendor)!, 1, 'guests', guests);

					const response = await request(getUrl(vendor))
						.get(`/items/guests?filter={"shows_attended": { "_nbetween": [${fromShowsAttended},${toShowsAttended}] }}`)
						.set('Authorization', 'Bearer AdminToken')
						.expect('Content-Type', /application\/json/)
						.expect(200);

					expect(response.body.data.length).toBe(7);
				});

				it.each(vendors)('%s - from string', async (vendor) => {
					const fromShowsAttended = 1;
					const tohowsAttended = 3;

					const guests: any[] = createMany(createGuest, 10);
					for (let i = 0; i < guests.length; i++) {
						guests[i].shows_attended = i;
					}

					await seedTable(databases.get(vendor)!, 1, 'guests', guests);

					const response = await request(getUrl(vendor))
						.get(`/items/guests?filter={"shows_attended": { "_nbetween": "${fromShowsAttended},${tohowsAttended}" }}`)
						.set('Authorization', 'Bearer AdminToken')
						.expect('Content-Type', /application\/json/)
						.expect(200);

					expect(response.body.data.length).toBe(7);
				});
			});
			describe('returns users with name _in', () => {
				it.each(vendors)('%s - from array', async (vendor) => {
					const guests: any[] = createMany(createGuest, 10);
					for (let i = 0; i < guests.length; i++) {
						guests[i].shows_attended = i;
					}

					await seedTable(databases.get(vendor)!, 1, 'guests', guests);

					const response = await request(getUrl(vendor))
						.get(`/items/guests?filter={"shows_attended": { "_in": [0,1,2] }}`)
						.set('Authorization', 'Bearer AdminToken')
						.expect('Content-Type', /application\/json/)
						.expect(200);

					expect(response.body.data.length).toBe(3);
				});

				it.each(vendors)('%s - from string', async (vendor) => {
					const guests: any[] = createMany(createGuest, 10);
					for (let i = 0; i < guests.length; i++) {
						guests[i].shows_attended = i;
					}

					await seedTable(databases.get(vendor)!, 1, 'guests', guests);

					const response = await request(getUrl(vendor))
						.get(`/items/guests?filter={"shows_attended": { "_in": "0,1,2" }}`)
						.set('Authorization', 'Bearer AdminToken')
						.expect('Content-Type', /application\/json/)
						.expect(200);

					expect(response.body.data.length).toBe(3);
				});
			});
			describe('returns users with name _nin', () => {
				it.each(vendors)('%s - from array', async (vendor) => {
					const guests: any[] = createMany(createGuest, 10);
					for (let i = 0; i < guests.length; i++) {
						guests[i].shows_attended = i;
					}

					await seedTable(databases.get(vendor)!, 1, 'guests', guests);

					const response = await request(getUrl(vendor))
						.get(`/items/guests?filter={"shows_attended": { "_nin": [0,1,2] }}`)
						.set('Authorization', 'Bearer AdminToken')
						.expect('Content-Type', /application\/json/)
						.expect(200);

					expect(response.body.data.length).toBe(7);
				});

				it.each(vendors)('%s - from string', async (vendor) => {
					const guests: any[] = createMany(createGuest, 10);
					for (let i = 0; i < guests.length; i++) {
						guests[i].shows_attended = i;
					}

					await seedTable(databases.get(vendor)!, 1, 'guests', guests);

					const response = await request(getUrl(vendor))
						.get(`/items/guests?filter={"shows_attended": { "_nin": "0,1,2" }}`)
						.set('Authorization', 'Bearer AdminToken')
						.expect('Content-Type', /application\/json/)
						.expect(200);

					expect(response.body.data.length).toBe(7);
				});
			});
			describe('returns users with name _contains', () => {
				it.each(vendors)('%s', async (vendor) => {
					const name = 'rnat';
					const guests: any[] = createMany(createGuest, 10);
					guests[0].name = 'Bernat1';
					guests[1].name = 'Bernat2';

					await seedTable(databases.get(vendor)!, 1, 'guests', guests);

					const response = await request(getUrl(vendor))
						.get(`/items/guests?filter={"name": { "_contains": "${name}" }}&sort=name`)
						.set('Authorization', 'Bearer AdminToken')
						.expect('Content-Type', /application\/json/)
						.expect(200);

					expect(response.body.data.length).toBe(2);
					expect(response.body.data).toMatchObject([{ name: 'Bernat1' }, { name: 'Bernat2' }]);
				});
			});
			describe('returns users with name _icontains', () => {
				it.each(vendors)('%s', async (vendor) => {
					const name = 'bernat';
					const guests: any[] = createMany(createGuest, 10);
					guests[0].name = 'beRnat1';

					await seedTable(databases.get(vendor)!, 1, 'guests', guests);

					const response = await request(getUrl(vendor))
						.get(`/items/guests?filter={"name": { "_icontains": "${name}" }}`)
						.set('Authorization', 'Bearer AdminToken')
						.expect('Content-Type', /application\/json/)
						.expect(200);

					expect(response.body.data.length).toBe(1);
					expect(response.body.data).toMatchObject([{ name: 'beRnat1' }]);
				});
			});
			describe('returns users with name _ncontains', () => {
				it.each(vendors)('%s', async (vendor) => {
					const name = 'ernade';
					const guests: any[] = createMany(createGuest, 10);
					guests[0].name = 'Bernadet';

					await seedTable(databases.get(vendor)!, 1, 'guests', guests);

					const response = await request(getUrl(vendor))
						.get(`/items/guests?filter={"name": { "_ncontains": "${name}" }}`)
						.set('Authorization', 'Bearer AdminToken')
						.expect('Content-Type', /application\/json/)
						.expect(200);

					expect(response.body.data.length).toBe(9);
				});
			});
			describe('returns users with name _nicontains', () => {
				it.each(vendors)('%s', async (vendor) => {
					const name = 'bernat';
					const guests: any[] = createMany(createGuest, 10);
					guests[0].name = 'beRnat1';

					await seedTable(databases.get(vendor)!, 1, 'guests', guests);

					const response = await request(getUrl(vendor))
						.get(`/items/guests?filter={"name": { "_nicontains": "${name}" }}`)
						.set('Authorization', 'Bearer AdminToken')
						.expect('Content-Type', /application\/json/)
						.expect(200);

					expect(response.body.data.length).toBe(9);
				});
			});
			describe('returns users with name _ends_with', () => {
				it.each(vendors)('%s', async (vendor) => {
					const name = 'nat1';
					const guests: any[] = createMany(createGuest, 10);
					guests[0].name = 'Bernat1';
					guests[1].name = 'Bernat2';

					await seedTable(databases.get(vendor)!, 1, 'guests', guests);

					const response = await request(getUrl(vendor))
						.get(`/items/guests?filter={"name": { "_ends_with": "${name}" }}`)
						.set('Authorization', 'Bearer AdminToken')
						.expect('Content-Type', /application\/json/)
						.expect(200);

					expect(response.body.data.length).toBe(1);
					expect(response.body.data).toMatchObject([{ name: 'Bernat1' }]);
				});
			});
			describe('returns users with name _iends_with', () => {
				it.each(vendors)('%s', async (vendor) => {
					const name = 'nat1';
					const guests: any[] = createMany(createGuest, 10);
					guests[0].name = 'BerNaT1';

					await seedTable(databases.get(vendor)!, 1, 'guests', guests);

					const response = await request(getUrl(vendor))
						.get(`/items/guests?filter={"name": { "_iends_with": "${name}" }}`)
						.set('Authorization', 'Bearer AdminToken')
						.expect('Content-Type', /application\/json/)
						.expect(200);

					expect(response.body.data.length).toBe(1);
					expect(response.body.data).toMatchObject([{ name: 'BerNaT1' }]);
				});
			});
			describe('returns users with name _niends_with', () => {
				it.each(vendors)('%s', async (vendor) => {
					const name = 'nat1';
					const guests: any[] = createMany(createGuest, 10);
					guests[0].name = 'BerNaT1';

					await seedTable(databases.get(vendor)!, 1, 'guests', guests);

					const response = await request(getUrl(vendor))
						.get(`/items/guests?filter={"name": { "_niends_with": "${name}" }}`)
						.set('Authorization', 'Bearer AdminToken')
						.expect('Content-Type', /application\/json/)
						.expect(200);

					expect(response.body.data.length).toBe(9);
				});
			});

			describe('returns users with name _starts_with', () => {
				it.each(vendors)('%s', async (vendor) => {
					const name = 'Ber';
					const guests: any[] = createMany(createGuest, 10);
					guests[0].name = 'Bernat';

					await seedTable(databases.get(vendor)!, 1, 'guests', guests);

					const response = await request(getUrl(vendor))
						.get(`/items/guests?filter={"name": { "_starts_with": "${name}" }}`)
						.set('Authorization', 'Bearer AdminToken')
						.expect('Content-Type', /application\/json/)
						.expect(200);

					expect(response.body.data.length).toBe(1);
					expect(response.body.data[0]).toMatchObject({ name: 'Bernat' });
				});
			});
			describe('returns users with name _istarts_with', () => {
				it.each(vendors)('%s', async (vendor) => {
					const name = 'bern';
					const guests: any[] = createMany(createGuest, 10);
					guests[0].name = 'BerNaT1';

					await seedTable(databases.get(vendor)!, 1, 'guests', guests);

					const response = await request(getUrl(vendor))
						.get(`/items/guests?filter={"name": { "_istarts_with": "${name}" }}`)
						.set('Authorization', 'Bearer AdminToken')
						.expect('Content-Type', /application\/json/)
						.expect(200);

					expect(response.body.data.length).toBe(1);
					expect(response.body.data[0]).toMatchObject({ name: 'BerNaT1' });
				});
			});
			describe('returns users with name _nstarts_with', () => {
				it.each(vendors)('%s', async (vendor) => {
					const name = 'Bern';
					const guests: any[] = createMany(createGuest, 10);
					guests[0].name = 'Bernat';

					await seedTable(databases.get(vendor)!, 1, 'guests', guests);

					const response = await request(getUrl(vendor))
						.get(`/items/guests?filter={"name": { "_nstarts_with": "${name}" }}`)
						.set('Authorization', 'Bearer AdminToken')
						.expect('Content-Type', /application\/json/)
						.expect(200);

					expect(response.body.data.length).toBe(9);
				});
			});
			describe('returns users with name _nistarts_with', () => {
				it.each(vendors)('%s', async (vendor) => {
					const name = 'bern';
					const guests: any[] = createMany(createGuest, 10);
					guests[0].name = 'BerNaT1';

					await seedTable(databases.get(vendor)!, 1, 'guests', guests);

					const response = await request(getUrl(vendor))
						.get(`/items/guests?filter={"name": { "_nistarts_with": "${name}" }}`)
						.set('Authorization', 'Bearer AdminToken')
						.expect('Content-Type', /application\/json/)
						.expect(200);

					expect(response.body.data.length).toBe(9);
				});
			});
			describe('returns users with name _gte', () => {
				it.each(vendors)('%s', async (vendor) => {
					const guests: any[] = createMany(createGuest, 10);
					for (let i = 0; i < guests.length; i++) {
						guests[i].shows_attended = i;
					}

					await seedTable(databases.get(vendor)!, 1, 'guests', guests);

					const response = await request(getUrl(vendor))
						.get(`/items/guests?filter={"shows_attended": { "_gte": 5 }}`)
						.set('Authorization', 'Bearer AdminToken')
						.expect('Content-Type', /application\/json/)
						.expect(200);

					expect(response.body.data.length).toBe(5);
				});
			});
			describe('returns users with name _gt', () => {
				it.each(vendors)('%s', async (vendor) => {
					const guests: any[] = createMany(createGuest, 10);
					for (let i = 0; i < guests.length; i++) {
						guests[i].shows_attended = i;
					}

					await seedTable(databases.get(vendor)!, 1, 'guests', guests);

					const response = await request(getUrl(vendor))
						.get(`/items/guests?filter={"shows_attended": { "_gt": 5 }}`)
						.set('Authorization', 'Bearer AdminToken')
						.expect('Content-Type', /application\/json/)
						.expect(200);

					expect(response.body.data.length).toBe(4);
				});
			});
			describe('returns users with name _lte', () => {
				it.each(vendors)('%s - from array', async (vendor) => {
					const guests: any[] = createMany(createGuest, 10);
					for (let i = 0; i < guests.length; i++) {
						guests[i].shows_attended = i;
					}

					await seedTable(databases.get(vendor)!, 1, 'guests', guests);

					const response = await request(getUrl(vendor))
						.get(`/items/guests?filter={"shows_attended": { "_lte": 5 }}`)
						.set('Authorization', 'Bearer AdminToken')
						.expect('Content-Type', /application\/json/)
						.expect(200);

					expect(response.body.data.length).toBe(6);
				});
			});
			describe('returns users with name _lt', () => {
				it.each(vendors)('%s - from array', async (vendor) => {
					const guests: any[] = createMany(createGuest, 10);
					for (let i = 0; i < guests.length; i++) {
						guests[i].shows_attended = i;
					}

					await seedTable(databases.get(vendor)!, 1, 'guests', guests);

					const response = await request(getUrl(vendor))
						.get(`/items/guests?filter={"shows_attended": { "_lt": 5 }}`)
						.set('Authorization', 'Bearer AdminToken')
						.expect('Content-Type', /application\/json/)
						.expect(200);

					expect(response.body.data.length).toBe(5);
				});
			});

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
			describe('returns users with name _ieq', () => {
				it.each(vendors)('%s', async (vendor) => {
					const name = 'bernat1';
					const guests: any[] = createMany(createGuest, 10);
					guests[0].name = 'BerNaT1';

					await seedTable(databases.get(vendor)!, 1, 'guests', guests);

					const response = await request(getUrl(vendor))
						.get(`/items/guests?filter={"name": { "_ieq": "${name}" }}`)
						.set('Authorization', 'Bearer AdminToken')
						.expect('Content-Type', /application\/json/)
						.expect(200);

					expect(response.body.data.length).toBe(1);
					expect(response.body.data).toMatchObject([{ name: 'BerNaT1' }]);
				});
			});
			describe('returns users with name _nieq', () => {
				it.each(vendors)('%s', async (vendor) => {
					const name = 'bernat1';
					const guests: any[] = createMany(createGuest, 10);
					guests[0].name = 'BerNaT1';

					await seedTable(databases.get(vendor)!, 1, 'guests', guests);

					const response = await request(getUrl(vendor))
						.get(`/items/guests?filter={"name": { "_nieq": "${name}" }}`)
						.set('Authorization', 'Bearer AdminToken')
						.expect('Content-Type', /application\/json/)
						.expect(200);

					expect(response.body.data.length).toBe(9);
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
