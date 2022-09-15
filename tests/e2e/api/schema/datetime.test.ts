import config, { getUrl } from '../../config';
import vendors from '../../get-dbs-to-test';
import request from 'supertest';
import knex, { Knex } from 'knex';
import { find, cloneDeep } from 'lodash';
import { validateDateDifference } from '../utils/validate-date-difference';

type SchemaDateTypesObject = {
	id: number;
	date: string;
	time?: string;
	datetime: string;
	timestamp: string;
};

type SchemaDateTypesResponse = SchemaDateTypesObject & {
	date_created: string;
	date_updated: string;
};

describe('schema', () => {
	const databases = new Map<string, Knex>();

	const sampleDates: SchemaDateTypesObject[] = [];

	for (let i = 0; i < 24; i++) {
		const hour = i < 10 ? '0' + i : String(i);
		sampleDates.push(
			{
				id: 1 + i * 3,
				date: `2022-01-05`,
				time: `${hour}:11:11`,
				datetime: `2022-01-05T${hour}:11:11`,
				timestamp: `2022-01-05T${hour}:11:11-01:00`,
			},
			{
				id: 2 + i * 3,
				date: `2022-01-10`,
				time: `${hour}:22:22`,
				datetime: `2022-01-10T${hour}:22:22`,
				timestamp: `2022-01-10T${hour}:22:22Z`,
			},
			{
				id: 3 + i * 3,
				date: `2022-01-15`,
				time: `${hour}:33:33`,
				datetime: `2022-01-15T${hour}:33:33`,
				timestamp: `2022-01-15T${hour}:33:33+02:00`,
			}
		);
	}

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

	describe('Date Types', () => {
		describe('update datetime field schema', () => {
			it.each(vendors)(
				'%s',
				async (vendor) => {
					await request(getUrl(vendor))
						.patch(`/collections/schema_date_types`)
						.send({
							meta: {},
						})
						.set('Authorization', 'Bearer AdminToken')
						.expect('Content-Type', /application\/json/)
						.expect(200);

					await request(getUrl(vendor))
						.patch(`/fields/schema_date_types/date_created`)
						.send({
							meta: {
								special: ['date-created'],
							},
						})
						.set('Authorization', 'Bearer AdminToken')
						.expect('Content-Type', /application\/json/)
						.expect(200);

					await request(getUrl(vendor))
						.patch(`/fields/schema_date_types/date_updated`)
						.send({
							meta: {
								special: ['date-updated'],
							},
						})
						.set('Authorization', 'Bearer AdminToken')
						.expect('Content-Type', /application\/json/)
						.expect(200);

					switch (vendor) {
						case 'sqlite3':
							await request(getUrl(vendor))
								.patch(`/fields/schema_date_types/timestamp`)
								.send({
									meta: {
										special: ['cast-timestamp'],
									},
								})
								.set('Authorization', 'Bearer AdminToken')
								.expect('Content-Type', /application\/json/)
								.expect(200);
							await request(getUrl(vendor))
								.patch(`/fields/schema_date_types/date_created`)
								.send({
									meta: {
										special: ['date-created', 'cast-timestamp'],
									},
								})
								.set('Authorization', 'Bearer AdminToken')
								.expect('Content-Type', /application\/json/)
								.expect(200);

							await request(getUrl(vendor))
								.patch(`/fields/schema_date_types/date_updated`)
								.send({
									meta: {
										special: ['date-updated', 'cast-timestamp'],
									},
								})
								.set('Authorization', 'Bearer AdminToken')
								.expect('Content-Type', /application\/json/)
								.expect(200);
							break;
						case 'oracle':
							await request(getUrl(vendor))
								.patch(`/fields/schema_date_types/datetime`)
								.send({
									meta: {
										special: ['cast-datetime'],
									},
								})
								.set('Authorization', 'Bearer AdminToken')
								.expect('Content-Type', /application\/json/)
								.expect(200);
							break;
						default:
							break;
					}
				},
				10000
			);
		});

		describe('stores the correct datetime data', () => {
			it.each(vendors)(
				'%s',
				async (vendor) => {
					const dates = cloneDeep(sampleDates);

					if (vendor === 'oracle') {
						for (const date of dates) {
							delete date.time;
						}
					}

					const insertionStartTimestamp = new Date();

					await request(getUrl(vendor))
						.post(`/items/schema_date_types`)
						.send(dates)
						.set('Authorization', 'Bearer AdminToken')
						.expect('Content-Type', /application\/json/)
						.expect(200);

					const insertionEndTimestamp = new Date();

					const response = await request(getUrl(vendor))
						.get(`/items/schema_date_types?fields=*`)
						.set('Authorization', 'Bearer AdminToken')
						.expect('Content-Type', /application\/json/)
						.expect(200);

					expect(response.body.data.length).toBe(sampleDates.length);

					for (let index = 0; index < sampleDates.length; index++) {
						const responseObj = find(response.body.data, (o) => {
							return o.id === sampleDates[index]!.id;
						}) as SchemaDateTypesResponse;

						if (vendor === 'oracle') {
							expect(responseObj.date).toBe(sampleDates[index]!.date);
							expect(responseObj.datetime).toBe(sampleDates[index]!.datetime);
							expect(responseObj.timestamp.substring(0, 19)).toBe(
								new Date(sampleDates[index]!.timestamp).toISOString().substring(0, 19)
							);
							const dateCreated = new Date(responseObj.date_created);
							expect(dateCreated.toISOString()).toBe(
								validateDateDifference(
									insertionStartTimestamp,
									dateCreated,
									insertionEndTimestamp.getTime() - insertionStartTimestamp.getTime()
								).toISOString()
							);
							expect(responseObj.date_updated).toBeNull();
							continue;
						}

						expect(responseObj.date).toBe(sampleDates[index]!.date);
						expect(responseObj.time).toBe(sampleDates[index]!.time);
						expect(responseObj.datetime).toBe(sampleDates[index]!.datetime);
						expect(responseObj.timestamp.substring(0, 19)).toBe(
							new Date(sampleDates[index]!.timestamp).toISOString().substring(0, 19)
						);
						const dateCreated = new Date(responseObj.date_created);
						expect(dateCreated.toISOString()).toBe(
							validateDateDifference(
								insertionStartTimestamp,
								dateCreated,
								insertionEndTimestamp.getTime() - insertionStartTimestamp.getTime() + 1000
							).toISOString()
						);
						expect(responseObj.date_updated).toBeNull();
					}
				},
				10000
			);
		});

		describe('stores the correct timestamp when updated', () => {
			it.each(vendors)('%s', async (vendor) => {
				const payload = {
					date: sampleDates[0]!.date,
				};

				const updateStartTimestamp = new Date();

				await request(getUrl(vendor))
					.patch(`/items/schema_date_types/${sampleDates[0]!.id}`)
					.send(payload)
					.set('Authorization', 'Bearer AdminToken')
					.expect('Content-Type', /application\/json/)
					.expect(200);

				const updateEndTimestamp = new Date();

				const response = await request(getUrl(vendor))
					.get(`/items/schema_date_types/${sampleDates[0]!.id}?fields=*`)
					.set('Authorization', 'Bearer AdminToken')
					.expect('Content-Type', /application\/json/)
					.expect(200);

				const responseObj = response.body.data as SchemaDateTypesResponse;

				expect(responseObj.date).toBe(sampleDates[0]!.date);
				expect(responseObj.date_created).not.toBeNull();
				expect(responseObj.date_updated).not.toBeNull();
				const dateCreated = new Date(responseObj.date_created);
				const dateUpdated = new Date(responseObj.date_updated);
				expect(dateUpdated.toISOString()).not.toBe(dateCreated.toISOString());
				expect(dateUpdated.toISOString()).toBe(
					validateDateDifference(
						updateStartTimestamp,
						dateUpdated,
						updateEndTimestamp.getTime() - updateStartTimestamp.getTime() + 1000
					).toISOString()
				);
			});
		});

		describe('retrieve the correct hour values for date functions', () => {
			it.each(vendors)('%s', async (vendor) => {
				for (let index = 10; index < 13; index++) {
					const response = await request(getUrl(vendor))
						.get(`/items/schema_date_types/${sampleDates[index]!.id}?fields[]=hour(datetime)&fields[]=hour(timestamp)`)
						.set('Authorization', 'Bearer AdminToken')
						.expect('Content-Type', /application\/json/)
						.expect(200);

					const responseObj = response.body.data as any;

					expect(parseInt(responseObj.datetime_hour)).toBe(parseInt(sampleDates[index]!.datetime.slice(11, 13)));
					expect(parseInt(responseObj.timestamp_hour)).toBe(
						parseInt(new Date(sampleDates[index]!.timestamp).toISOString().slice(11, 13))
					);
				}
			});
		});
	});
});
