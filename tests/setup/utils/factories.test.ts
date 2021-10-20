import {
	createArtist,
	createEvent,
	createTour,
	createGuest,
	seedTable,
	createOrganizer,
	createMany,
} from './factories';
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
				description: expect.any(String),
				tags: expect.any(String),
				time: expect.any(String),
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
	describe('createOrganizer', () => {
		it('returns an object of column names and values', () => {
			expect(createOrganizer()).toMatchObject({
				company_name: expect.any(String),
			});
		});
	});
	describe('createTour', () => {
		it('revenue to be the correct type', () => {
			expect(typeof createTour().revenue).toBe('bigint');
		});
	});
	describe('createMany', () => {
		it('returns an array of Artists', () => {
			const artists = createMany(createArtist, 4);
			expect(artists[0]).toMatchObject({ name: expect.any(String) });
			expect(artists.length).toBe(4);
		});
		it('returns an array of Guests with a favorite_artist when passed in options', () => {
			const guests = createMany(createGuest, 4, { favorite_artist: 7 });
			expect(guests[0]).toMatchObject({ name: expect.any(String), favorite_artist: expect.any(Number) });
			expect(guests.length).toBe(4);
		});
	});
});

describe('seeding databases', () => {
	const databases = new Map<string, Knex>();
	beforeAll(async () => {
		const vendors = getDBsToTest();

		for (const vendor of vendors) {
			databases.set(vendor, knex(config.knexConfig[vendor]!));
		}
	});
	afterAll(async () => {
		const vendors = getDBsToTest();

		for (const vendor of vendors) {
			databases.set(vendor, knex(config.knexConfig[vendor]!));
			const database = databases.get(vendor);
			await database!('artists').truncate();
			await database!.destroy();
		}
	});
	describe('seedTable', () => {
		it.each(getDBsToTest())('%p returns void when there is no options', async (vendor) => {
			const database = databases.get(vendor);
			expect(await seedTable(database!, 5, 'artists', createArtist)).toBe(undefined);
		});
		it.each(getDBsToTest())('%p to insert the correct number of artists', async (vendor) => {
			const database = databases.get(vendor);

			expect(await seedTable(database!, 1606, 'artists', createArtist)).toBe(undefined);

			const count = await database!('artists').count('*', { as: 'artists' });
			if (typeof count[0]?.artists === 'string') expect(parseInt(count[0]?.artists)).toBeGreaterThanOrEqual(1606);
		});
		it.each(getDBsToTest())('%p has a response based on passed in options select and where', async (vendor) => {
			const database = databases.get(vendor);

			const options = { select: ['name', 'members'], where: ['name', 'Tommy Cash'] };

			expect(
				await seedTable(
					database!,
					1,
					'artists',
					{ name: 'Tommy Cash', members: JSON.stringify({ synths: 'Terry' }) },
					options
				)
			).toMatchObject([
				{
					name: 'Tommy Cash',
				},
			]);
		});
		it.each(getDBsToTest())('%p has a response based on passed in options raw', async (vendor) => {
			const database = databases.get(vendor);

			const options = { raw: `SELECT name from artists WHERE name='Johnny Cash';` };
			const response: any = await seedTable(
				database!,
				1,
				'artists',
				{ name: 'Johnny Cash', members: JSON.stringify({ guitar: 'Terry' }) },
				options
			);
			if (vendor === 'postgres') {
				expect(response.rows[0]).toStrictEqual({
					name: 'Johnny Cash',
				});
			}
			if (vendor === 'mssql') {
				expect(response).toStrictEqual([
					{
						name: 'Johnny Cash',
					},
				]);
			}
			if (vendor === 'mysql' || vendor === 'maria') {
				expect(response[0]).toMatchObject([
					{
						name: 'Johnny Cash',
					},
				]);
			}
		});
	});
	describe('inserting factories', () => {
		describe('createArtist', () => {
			it.each(getDBsToTest())('%p returns an artist object of column names and values', async (vendor) => {
				const database = databases.get(vendor);
				const artist = createArtist();
				const options = { select: ['*'], where: ['name', artist.name] };
				if (vendor === 'postgres' && typeof artist.members === 'string') {
					artist.members = JSON.parse(artist.members);

					expect(await seedTable(database!, 5, 'artists', artist, options)).toMatchObject([
						{
							name: artist.name,
							members: artist.members,
						},
					]);
				} else if (vendor === 'mysql' && typeof artist.members === 'string') {
					expect(await seedTable(database!, 5, 'artists', artist, options)).toMatchObject([
						{
							name: artist.name,
							members: `{"guitar": "${JSON.parse(artist.members).guitar}"}`,
						},
					]);
				} else {
					expect(await seedTable(database!, 5, 'artists', artist, options)).toMatchObject([
						{
							name: artist.name,
							members: artist.members,
						},
					]);
				}
			});
		});

		describe('createEvent', () => {
			it.each(getDBsToTest())('%p returns an event object of column names and values', async (vendor) => {
				const database = databases.get(vendor)!;
				const options = { select: ['*'], where: ['id', 1] };
				if (vendor === 'mssql') {
					expect(await seedTable(database, 1, 'events', createEvent, options)).toMatchObject([
						{
							cost: expect.any(Number),
							created_at: expect.any(Date),
							description: expect.any(String),
							tags: expect.any(String),
							time: expect.any(Date),
						},
					]);
				} else {
					expect(await seedTable(database, 1, 'events', createEvent, options)).toMatchObject([
						{
							cost: expect.any(Number),
							created_at: expect.any(Date),
							description: expect.any(String),
							tags: expect.any(String),
							time: expect.any(String),
						},
					]);
				}
			});
		});

		describe('createGuest', () => {
			it.each(getDBsToTest())('%p returns an guest object of column names and values', async (vendor) => {
				const database = databases.get(vendor)!;
				const guest = createGuest();
				const options = { select: ['*'], where: ['id', guest.id] };
				const insertedGuest = await seedTable(database, 1, 'guests', guest, options);
				if (vendor === 'mssql') {
					expect(insertedGuest).toMatchObject([
						{
							name: guest.name,
							birthday: expect.any(Date),
							earliest_events_to_show: expect.any(Date),
							latest_events_to_show: expect.any(Date),
							password: guest.password,
							shows_attended: guest.shows_attended,
						},
					]);
				} else {
					expect(insertedGuest).toMatchObject([
						{
							earliest_events_to_show: expect.any(String),
							latest_events_to_show: expect.any(String),
						},
					]);
				}
			});
		});

		describe('createTour', () => {
			it.each(getDBsToTest())('%p returns an tour object of column names and values', async (vendor) => {
				const database = databases.get(vendor)!;
				const tour = createTour();
				const options = { select: ['*'], where: ['revenue', tour.revenue] };
				const insertedTour = await seedTable(database, 1, 'tours', tour, options);

				if (vendor === 'mysql' || vendor === 'maria') {
					expect(insertedTour[0].revenue.toString()).toBe(tour.revenue.toString());
				} else {
					expect(insertedTour).toMatchObject([
						{
							revenue: tour.revenue.toString(),
						},
					]);
				}
			});
		});

		describe('createOrganizer', () => {
			it.each(getDBsToTest())('%p returns an organizer object of column names and values', async (vendor) => {
				const database = databases.get(vendor)!;
				const options = { select: ['*'], where: ['id', 1] };
				expect(await seedTable(database, 5, 'organizers', createOrganizer(), options)).toMatchObject([
					{
						company_name: expect.any(String),
					},
				]);
			});
		});

		describe('createMany', () => {
			// it.each(getDBsToTest())('%p returns an tour object of column names and values', async (vendor) => {
			// 			const database = databases.get(vendor);
			// const options = { select: ['*'], where: ["id", 1] };
			// 	expect(await seedTable(database, 5, 'tours', createOrganizer(), options)).toMatchObject([
			// 		{
			// 			name: expect.any(String),
			// 		},
			// 	]);
			// });
		});
	});
});
