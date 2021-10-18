import { createArtist, createEvent, createTour, createGuest, seedTable } from './factories';
import knex, { Knex } from 'knex';

describe('Item factories', () => {
	describe('createArtist', () => {
		it('returns an artist object of column names and values', () => {
			expect(createArtist()).toMatchObject({
				name: expect.any(String),
				members: { role: expect.any(String) },
			});
		});
	});

	describe('createEvent', () => {
		it('returns an event object of column names and values', () => {
			expect(createEvent()).toMatchObject({
				cost: expect.any(Number),
				created_at: expect.any(Date),
				location: expect.any(String),
				description: expect.any(String),
				tags: expect.any(String),
				time: expect.any(Date),
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
		it('revenue_estimated to be the correct type', () => {
			expect(typeof createTour().revenue_estimated).toBe('bigint');
		});
	});
});

describe('seeding databases', () => {
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
	describe('seedTable', () => {
		it('returns void when there is no options', async () => {
			expect(await seedTable(database, 5, 'artists', createArtist)).toBe(undefined);
		});
		it('to insert the correct number of artists', async () => {
			expect(await seedTable(database, 1675, 'artists', createArtist)).toBe(undefined);

			const count = await database('artists').count('*', { as: 'artists' });
			if (typeof count[0]?.artists === 'string') expect(parseInt(count[0]?.artists)).toBeGreaterThanOrEqual(1600);
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
	describe('inserting factories', () => {
		describe('createArtist', () => {
			it('%p returns an artist object of column names and values', async () => {
				const options = { select: ['*'], where: ['id', 1] };
				expect(await seedTable(database, 5, 'artists', createArtist, options)).toMatchObject([
					{
						name: expect.any(String),
						members: { role: expect.any(String) },
					},
				]);
			});
		});

		describe('createEvent', () => {
			// it('returns an event object of column names and values', async () => {
			// 	const options = { select: ['*'], where: [id: 1] };
			// 	expect(await seedTable(database, 5, 'events', createEvent(), options)).toMatchObject([
			// 		{
			// 		cost: expect.any(Number),
			// 		created_at: expect.any(Date),
			// 		location: expect.any(String),
			// 		description: expect.any(String),
			// 		tags: expect.any(String),
			// 		time: expect.any(Date),
			// 		},
			// 	]);
			// });
		});

		describe('createGuest', () => {
			// it('returns an guest object of column names and values', async () => {
			// 	const options = { select: ['*'], where: [id: 1] };
			// 	expect(await seedTable(database, 5, 'guests', createGuest(), options)).toMatchObject([
			// 		{
			// 			name: expect.any(String),
			// 		},
			// 	]);
			// });
		});

		describe('createTour', () => {
			// it('returns an tour object of column names and values', async () => {
			// 	const options = { select: ['*'], where: [id: 1] };
			// 	expect(await seedTable(database, 5, 'tours', createTours(), options)).toMatchObject([
			// 		{
			// 			name: expect.any(String),
			// 		},
			// 	]);
			// });
		});
	});
});
