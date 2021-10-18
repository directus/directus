import { createArtist, createEvent, createTour, createGuest, seedTable } from './factories';
import knex, { Knex } from 'knex';
import config from '../../config';
import { getDBsToTest } from '../../get-dbs-to-test';

describe('Item factories', () => {
	describe('createArtist', () => {
		it('returns an artist object of column names and values', () => {
			expect(createArtist()).toMatchObject({
				name: expect.any(String),
				members: expect.any(String),
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
	const databases = new Map<string, Knex>();
	beforeAll(async () => {
		const vendors = getDBsToTest();

		for (const vendor of vendors) {
			databases.set(vendor, knex(config.knexConfig[vendor]!));
			const database = databases.get(vendor);

			await database!.schema.createTableIfNotExists('artists', (table: any) => {
				table.increments('id');
				table.string('name');
				table.json('members');
			});
		}
	});
	afterAll(async () => {
		const vendors = getDBsToTest();

		for (const vendor of vendors) {
			databases.set(vendor, knex(config.knexConfig[vendor]!));
			const database = databases.get(vendor);
			await database!('artists').truncate();
			database!.destroy();
		}
	});
	describe('seedTable', () => {
		it.each(getDBsToTest())('%p returns void when there is no options', async (vendor) => {
			const database = databases.get(vendor);
			expect(await seedTable(database!, 5, 'artists', createArtist)).toBe(undefined);
		});
		it.each(getDBsToTest())('%p to insert the correct number of artists', async (vendor) => {
			const database = databases.get(vendor);

			expect(await seedTable(database!, 1675, 'artists', createArtist)).toBe(undefined);

			const count = await database!('artists').count('*', { as: 'artists' });
			if (typeof count[0]?.artists === 'string') expect(parseInt(count[0]?.artists)).toBeGreaterThanOrEqual(1600);
		});
		it.each(getDBsToTest())('%p returns the query based on passed in options', async (vendor) => {
			const database = databases.get(vendor);

			const options = { select: ['name', 'members'], where: ['name', 'testing123'] };

			expect(
				await seedTable(
					database!,
					1,
					'artists',
					{ name: 'testing123', members: JSON.stringify({ role: 'terry' }) },
					options
				)
			).toMatchObject([
				{
					name: 'testing123',
				},
			]);
		});
	});
	describe('inserting factories', () => {
		describe('createArtist', () => {
			it.each(getDBsToTest())('%p returns an artist object of column names and values', async (vendor) => {
				const database = databases.get(vendor);

				const options = { select: ['*'], where: ['id', 1] };
				expect(await seedTable(database!, 5, 'artists', createArtist, options)).toMatchObject([
					{
						name: expect.any(String),
					},
				]);
			});
		});

		describe('createEvent', () => {
			// it.each(getDBsToTest())('%p returns an event object of column names and values', async (vendor) => {
			// const database = databases.get(vendor);
			// const options = { select: ['*'], where: ['id', 1] };
			// expect(await seedTable(database!, 5, 'events', createEvent(), options)).toMatchObject([
			// 	{
			// 		cost: expect.any(Number),
			// 		created_at: expect.any(Date),
			// 		location: expect.any(String),
			// 		description: expect.any(String),
			// 		tags: expect.any(String),
			// 		time: expect.any(Date),
			// 	},
			// ]);
			// });
		});

		describe('createGuest', () => {
			// it.each(getDBsToTest())('%p returns an guest object of column names and values', async (vendor) => {
			// 			const database = databases.get(vendor);
			// const options = { select: ['*'], where: ["id", 1] };
			// 	expect(await seedTable(database, 5, 'guests', createGuest(), options)).toMatchObject([
			// 		{
			// 			name: expect.any(String),
			// 		},
			// 	]);
			// });
		});

		describe('createTour', () => {
			// it.each(getDBsToTest())('%p returns an tour object of column names and values', async (vendor) => {
			// 			const database = databases.get(vendor);
			// const options = { select: ['*'], where: ["id", 1] };
			// 	expect(await seedTable(database, 5, 'tours', createTours(), options)).toMatchObject([
			// 		{
			// 			name: expect.any(String),
			// 		},
			// 	]);
			// });
		});
	});
});
