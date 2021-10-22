import axios from 'axios';
import request from 'supertest';
import config from '../../config';
import { getDBsToTest } from '../../get-dbs-to-test';
import knex, { Knex } from 'knex';
import { createArtist, createGuest, createMany, seedTable } from '../../setup/utils/factories';

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

	describe('/:collection/:id GET', () => {
		it.each(getDBsToTest())(`%p retrieves a guest's favorite artist`, async (vendor) => {
			const url = `http://localhost:${config.ports[vendor]!}`;
			const guest = createGuest();
			const insertedArtist = await seedTable(databases.get(vendor)!, 1, 'artists', createArtist(), {
				select: ['id'],
			});
			guest.favorite_artist = insertedArtist[insertedArtist.length - 1].id;
			const insertedGuest = await seedTable(databases.get(vendor)!, 1, 'guests', guest, {
				select: ['id'],
				where: ['name', guest.name],
			});

			const response = await request(url)
				.get(`/items/guests/${insertedGuest[0].id}?fields=favorite_artist.*`)
				.set('Authorization', 'Bearer AdminToken')
				.expect('Content-Type', /application\/json/)
				.expect(200);

			expect(response.body.data).toMatchObject({ favorite_artist: { name: expect.any(String) } });
		});
	});

	describe('/:collection GET', () => {
		it.each(getDBsToTest())('%p retrieves all items from guest table with favorite_artist', async (vendor) => {
			const url = `http://localhost:${config.ports[vendor]!}`;
			await seedTable(databases.get(vendor)!, 10, 'artists', createArtist);
			seedTable(databases.get(vendor)!, 1, 'guests', createMany(createGuest, 10, { favorite_artist: 10 })!);

			const response = await request(url)
				.get('/items/guests')
				.set('Authorization', 'Bearer AdminToken')
				.expect('Content-Type', /application\/json/)
				.expect(200);

			expect(response.body.data.length).toBeGreaterThanOrEqual(10);
			expect(response.body.data[0]).toMatchObject({
				birthday: expect.any(String),
				favorite_artist: expect.any(Number),
			});
		});
	});

	describe('/:collection POST', () => {
		describe('createOne', () => {
			it.each(getDBsToTest())('%p creates one guest with a favorite_artist', async (vendor) => {
				const url = `http://localhost:${config.ports[vendor]!}`;
				const artist = createArtist();
				const body = createGuest();
				body.favorite_artist = artist;

				const response: any = await axios.post(`${url}/items/guests`, body, {
					headers: {
						Authorization: 'Bearer AdminToken',
						'Content-Type': 'application/json',
					},
				});
				expect(response.data.data).toMatchObject({ name: body.name, favorite_artist: expect.any(Number) });
			});
		});
		describe('createMany', () => {
			it.each(getDBsToTest())('%p creates 5 users with a favorite_artist', async (vendor) => {
				const url = `http://localhost:${config.ports[vendor]!}`;
				await seedTable(databases.get(vendor)!, 5, 'artists', createArtist);
				const body = createMany(createGuest, 5, { favorite_artist: 5 })!;

				const response: any = await axios.post(`${url}/items/guests`, body, {
					headers: {
						Authorization: 'Bearer AdminToken',
						'Content-Type': 'application/json',
					},
				});
				expect(response.data.data.length).toBe(body.length);
			});
		});
	});
	describe('/:collection/:id PATCH', () => {
		it.each(getDBsToTest())(`%p updates one guest's name to a different name`, async (vendor) => {
			const url = `http://localhost:${config.ports[vendor]!}`;

			const guest = createGuest();
			const insertedGuest = await seedTable(databases.get(vendor)!, 1, 'guests', guest, {
				select: ['id'],
				where: ['name', guest.name],
			});
			const body = { name: 'Tommy Cash' };
			const response: any = await axios.patch(`${url}/items/guests/${insertedGuest[0].id}`, body, {
				headers: {
					Authorization: 'Bearer AdminToken',
					'Content-Type': 'application/json',
				},
			});

			expect(response.data.data).toMatchObject({
				name: 'Tommy Cash',
			});
		});
	});
	// describe('/:collection/:id DELETE', () => {});
	// describe('/:collection PATCH', () => {});
	// describe('/:collection DELETE', () => {});
});
