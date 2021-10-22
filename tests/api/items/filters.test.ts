import config from '../../config';
import { getDBsToTest } from '../../get-dbs-to-test';
import request from 'supertest';
import knex, { Knex } from 'knex';
import { createArtist, createGuest, seedTable } from '../../setup/utils/factories';

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
				const guest = createGuest();
				await seedTable(databases.get(vendor)!, 10, 'guests', guest);

				const response = await request(url)
					.get(`/items/guests?filter={"name": { "_eq": "${guest.name}" }}`)
					.set('Authorization', 'Bearer AdminToken')
					.expect('Content-Type', /application\/json/)
					.expect(200);

				expect(response.body.data.length).toBe(10);
				expect(response.body.data[0]).toMatchObject({
					name: guest.name,
				});
			});
			it.each(getDBsToTest())('%p returns users with name _neq', async (vendor) => {
				const url = `http://localhost:${config.ports[vendor]!}`;
				const guest = createGuest();
				await seedTable(databases.get(vendor)!, 10, 'guests', guest);

				const response = await request(url)
					.get(`/items/guests?&filter={"name": { "_neq": "${guest.name}" }}`)
					.set('Authorization', 'Bearer AdminToken')
					.expect('Content-Type', /application\/json/)
					.expect(200);

				expect(Object.values(response.body.data).includes(guest.name)).toBeFalsy();
			});
		});

		describe('Logical Operators', () => {
			it.each(getDBsToTest())('%p returns users with name equality _AND favorite_artist equality', async (vendor) => {
				const url = `http://localhost:${config.ports[vendor]!}`;
				const insertedArtist = await seedTable(databases.get(vendor)!, 10, 'artists', createArtist, {
					select: ['id'],
				});
				const pool1 = createGuest();
				await seedTable(databases.get(vendor)!, 5, 'guests', pool1);

				pool1.favorite_artist = insertedArtist.length - 1;
				await seedTable(databases.get(vendor)!, 5, 'guests', pool1);

				const response = await request(url)
					.get(
						`/items/guests?filter={"_and":[{"name": { "_eq": "${pool1.name}" }},{"favorite_artist": { "_eq": "${pool1.favorite_artist}" }}]}`
					)
					.set('Authorization', 'Bearer AdminToken')
					.expect('Content-Type', /application\/json/)
					.expect(200);

				expect(response.body.data.length).toBe(5);
			});
			it.each(getDBsToTest())('%p returns users with name equality _OR favorite_artist equality', async (vendor) => {
				const url = `http://localhost:${config.ports[vendor]!}`;
				const insertedArtist = await seedTable(databases.get(vendor)!, 10, 'artists', createArtist, {
					select: ['id'],
				});
				const pool1 = createGuest();
				await seedTable(databases.get(vendor)!, 5, 'guests', pool1);

				const pool2 = createGuest();
				pool2.favorite_artist = insertedArtist.length - 1;
				await seedTable(databases.get(vendor)!, 5, 'guests', pool2);

				const response = await request(url)
					.get(
						`/items/guests?filter={"_or":[{"name": { "_eq": "${pool1.name}" }},{"favorite_artist": { "_eq": "${pool2.favorite_artist}" }},]}`
					)
					.set('Authorization', 'Bearer AdminToken')
					.expect('Content-Type', /application\/json/)
					.expect(200);

				expect(response.body.data.length).toBe(10);
			});
		});
	});
});
