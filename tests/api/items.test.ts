import request from 'supertest';
import config from '../config';
import { getDBsToTest } from '../get-dbs-to-test';
import knex, { Knex } from 'knex';
import { v4 as uuid } from 'uuid';
import { createArtist, createUser, seedTable } from '../setup/utils/factories';

describe('/items', () => {
	const databases = new Map<string, Knex>();
	const userID = uuid();
	const roleID = uuid();

	beforeEach(async () => {
		const vendors = getDBsToTest();

		for (const vendor of vendors) {
			databases.set(vendor, knex(config.knexConfig[vendor]!));
			const database = databases.get(vendor);

			await database!('directus_roles').insert({
				id: roleID,
				name: 'test',
				icon: 'verified',
				admin_access: true,
				description: 'test admin role',
			});

			await database!('directus_users').insert({
				id: userID,
				status: 'active',
				email: 'test@example.com',
				password: 'password',
				first_name: 'Admin',
				last_name: 'User',
				role: roleID,
				token: 'test_token',
			});

			await database!('directus_collections').insert([
				{
					collection: 'users',
				},
				{
					collection: 'artists',
				},
			]);

			if ((await database!.schema.hasTable('artists')) === false) {
				await database!.schema.createTable('artists', (table) => {
					table.uuid('id').primary();
					table.string('name');
					table.json('members');
				});
			}

			if ((await database!.schema.hasTable('users')) === false) {
				await database!.schema.createTable('users', (table) => {
					table.uuid('id').primary();
					table.string('name');
					table.date('birthday');
					table.string('search_radius');
					table.time('earliest_events_to_show');
					table.time('latest_events_to_show');
					table.string('password');
					table.integer('shows_attended');
					table.uuid('favorite_artist').references('artist_id').inTable('artists');
				});
			}

			await database!('directus_relations').insert({
				many_collection: 'artists',
				many_field: 'favorite_artist',
				one_collection: 'users',
				one_field: 'favorite_artist',
			});
		}
	});

	afterEach(async () => {
		for (const [vendor, connection] of databases) {
			const database = databases.get(vendor)!;
			await database('directus_users').where('id', userID).del();
			await database('directus_roles').where('id', roleID).del();
			await database('directus_collections').where('collection', 'users').del();
			await database('directus_collections').where('collection', 'artists').del();

			await database.schema.dropTableIfExists('users');
			await database.schema.dropTableIfExists('artists');

			connection.destroy();
		}
	});

	describe('/:collection GET', () => {
		it.each(getDBsToTest())('%p retrieves all items from artist table with no relations', async (vendor) => {
			const url = `http://localhost:${config.ports[vendor]!}`;
			seedTable(databases.get(vendor)!, 100, 'artists', createArtist);

			const response = await request(url)
				.get('/items/artists')
				.set('Authorization', 'Bearer test_token')
				.expect('Content-Type', /application\/json/)
				.expect(200);

			expect(response.body.data.length).toBe(100);
			expect(Object.keys(response.body.data[0]).sort()).toStrictEqual(['id', 'members', 'name']);
		});
	});
	describe('/:collection/:id', () => {
		it.each(getDBsToTest())('%p retrieves one item', async (vendor) => {
			const url = `http://localhost:${config.ports[vendor]!}`;
			const artist = createArtist();
			await databases.get(vendor)!('artists').insert(artist);

			const response = await request(url)
				.get(`/items/artists/${artist.id}`)
				.set('Authorization', 'Bearer test_token')
				.expect('Content-Type', /application\/json/)
				.expect(200);

			if (vendor === 'mssql') {
				expect(response.body.data).toStrictEqual({
					id: artist.id.toUpperCase(),
					name: artist.name,
					members: artist.members,
				});
			} else if (vendor === 'postgres') {
				expect(response.body.data).toStrictEqual({
					id: artist.id,
					name: artist.name,
					members: JSON.parse(artist.members),
				});
			} else {
				expect(response.body.data.members).toStrictEqual(artist.members);
			}
		});
	});
});
