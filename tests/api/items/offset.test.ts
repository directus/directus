import config, { getUrl } from '../../config';
import vendors from '../../get-dbs-to-test';
import request from 'supertest';
import knex, { Knex } from 'knex';
import { createArtist, createEvent, createGuest, seedTable, createMany } from '../../setup/utils/factories';
import { internet } from 'faker';

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
		describe('returns offset correctly', () => {
			it.each(vendors)('%s', async (vendor) => {
				const name = internet.email();
				const guests: any[] = createMany(createGuest, 10, { name });
				await seedTable(databases.get(vendor)!, 1, 'guests', guests);

				const offset = 5;
				const response = await request(getUrl(vendor))
					.get(`/items/guests?filter={"name": { "_eq": "${name}" }}&offset=${offset}`)
					.set('Authorization', 'Bearer AdminToken')
					.expect('Content-Type', /application\/json/)
					.expect(200);

				expect(response.body.data.length).toBe(guests.length - offset);
			});
		});

		describe('returns relational offset correctly', () => {
			it.each(vendors)('%s', async (vendor) => {
				const artist = createArtist();
				const events = createMany(createEvent, 10);
				await seedTable(databases.get(vendor)!, 1, 'artists', artist);
				await seedTable(databases.get(vendor)!, 1, 'events', events);
				const artistsEvents = [];
				for (const event of events) {
					artistsEvents.push({ artists_id: artist.id, events_id: event.id });
				}
				await seedTable(databases.get(vendor)!, 1, 'artists_events', artistsEvents);

				const offset = 5;
				const response = await request(getUrl(vendor))
					.get(`/items/artists?filter={"id":{"_eq":"${artist.id}"}}&deep[events][_offset]=${offset}`)
					.set('Authorization', 'Bearer AdminToken')
					.expect('Content-Type', /application\/json/)
					.expect(200);

				expect(response.body.data.length).toBe(1);
				expect(response.body.data[0].events.length).toBe(events.length - offset);
			});
		});
	});
});
