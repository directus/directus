import { createArtist, createEvent, createTour, createGuest, seedTable } from './factories';
import knex, { Knex } from 'knex';

describe('seedTable', () => {
	let database: Knex;
	beforeAll(async () => {
		database = knex({
			client: 'pg',
			connection: {
				host: 'localhost',
				port: 6000,
				user: 'postgres',
				password: 'secret',
				database: 'directus',
			},
		});
		await database.schema.createTableIfNotExists('artists', (table: any) => {
			table.increments('id');
			table.string('name');
			table.json('members');
		});
	});
	afterAll(async () => {
		await database('artists').truncate();
		database.destroy();
	});

	it('returns void when there is no options', async () => {
		expect(await seedTable(database, 5, 'artists', createArtist())).toBe(undefined);
	});
	it('returns void when there is no options', async () => {
		expect(await seedTable(database, 1395, 'artists', createArtist())).toBe(undefined);
	});
	it('returns the query based on passed in options', async () => {
		const options = { select: ['name', 'members'], where: ['name', 'testing123'] };

		expect(
			await seedTable(database, 1, 'artists', { name: 'testing123', members: { role: 'terry' } }, options)
		).toMatchObject([
			{
				name: expect.any(String),
				members: { role: expect.any(String) },
			},
		]);
	});
});

describe('Item factories', () => {
	describe('createArtist', () => {
		it('returns an object of column names and values', () => {
			expect(createArtist()).toMatchObject({ name: expect.any(String), members: expect.any(String) });
		});
	});

	describe('createEvent', () => {
		it('returns an object of column names and values', () => {
			expect(createEvent()).toMatchObject({
				cost: expect.any(Number),
				created_at: expect.any(Date),
				location: expect.any(String),
			});
		});
	});

	describe('createGuest', () => {
		it('returns an object of column names and values', () => {
			expect(createGuest()).toMatchObject({
				id: expect.any(String),
				birthday: expect.any(Date),
				shows_attended: expect.any(Number),
			});
		});
	});

	describe('createTour', () => {
		it('returns an object of column names and values', () => {
			expect(typeof createTour().revenue_estimated).toBe('bigint');
		});
	});
});
