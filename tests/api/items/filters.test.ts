import config from '../../config';
import { getDBsToTest } from '../../get-dbs-to-test';
import request from 'supertest';
import knex, { Knex } from 'knex';
import { createArtist, createGuest, seedTable, createMany } from '../../setup/utils/factories';
import { v4 as uuid } from 'uuid';
import { internet } from 'faker';
describe('/items', () => {
	const databases = new Map<string, Knex>();

	beforeAll(async () => {
		const vendors = getDBsToTest();

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
			it.each(getDBsToTest())('%p returns users with name _eq', async (vendor) => {
				const url = `http://localhost:${config.ports[vendor]!}`;
				const name = internet.email();
				const guests: any[] = createMany(createGuest, 10);
				for (const guest of guests) {
					guest.id = uuid();
					guest.name = name;
				}
				await seedTable(databases.get(vendor)!, 1, 'guests', guests);

				const response = await request(url)
					.get(`/items/guests?filter={"name": { "_eq": "${name}" }}`)
					.set('Authorization', 'Bearer AdminToken')
					.expect('Content-Type', /application\/json/)
					.expect(200);

				expect(response.body.data.length).toBe(guests.length);
				expect(response.body.data[0]).toMatchObject({
					name: name,
				});
			});
			it.each(getDBsToTest())('%p returns users with name _neq', async (vendor) => {
				const url = `http://localhost:${config.ports[vendor]!}`;
				const guests: any[] = createMany(createGuest, 10);
				await seedTable(databases.get(vendor)!, 1, 'guests', guests);

				const response = await request(url)
					.get(`/items/guests?&filter={"name": { "_neq": "${guests[0].name}" }}`)
					.set('Authorization', 'Bearer AdminToken')
					.expect('Content-Type', /application\/json/)
					.expect(200);

				expect(Object.values(response.body.data).includes(guests[0].name)).toBeFalsy();
			});
		});

		describe('Logical Operators', () => {
			it.each(getDBsToTest())('%p returns users with name equality _AND favorite_artist equality', async (vendor) => {
				const url = `http://localhost:${config.ports[vendor]!}`;
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

				const response = await request(url)
					.get(
						`/items/guests?filter={"_and":[{"name": { "_eq": "${guests[0].name}" }},{"favorite_artist": { "_eq": "${guests[0].favorite_artist}" }}]}`
					)
					.set('Authorization', 'Bearer AdminToken')
					.expect('Content-Type', /application\/json/)
					.expect(200);

				expect(response.body.data.length).toBe(guests.length);
			});
			it.each(getDBsToTest())('%p returns users with name equality _OR favorite_artist equality', async (vendor) => {
				const url = `http://localhost:${config.ports[vendor]!}`;
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

				const response = await request(url)
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
