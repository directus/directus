import config from '../../config';
import vendors from '../../get-dbs-to-test';
import request from 'supertest';
import knex, { Knex } from 'knex';
import { find } from 'lodash';

type SchemaDateTypesObject = {
	id: number;
	date: string;
	time: string;
	datetime: string;
	timestamp: string;
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
				timestamp: `2022-01-05T${hour}:11:11-08:00`,
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
				timestamp: `2022-01-15T${hour}:33:33+08:00`,
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
		const data: Record<string, SchemaDateTypesObject[]> = {};

		describe('Date', () => {
			it.each(vendors)('%p stores the correct datetime data', async (vendor) => {
				const url = `http://localhost:${config.envs[vendor]!.PORT!}`;

				data[vendor] = sampleDates;

				await request(url)
					.post(`/items/schema_date_types`)
					.send(sampleDates)
					.set('Authorization', 'Bearer AdminToken')
					.expect('Content-Type', /application\/json/)
					.expect(200);

				const response = await request(url)
					.get(`/items/schema_date_types?fields=*`)
					.set('Authorization', 'Bearer AdminToken')
					.expect('Content-Type', /application\/json/)
					.expect(200);

				expect(response.body.data.length).toBe(sampleDates.length);

				for (let index = 0; index < data[vendor]!.length; index++) {
					const responseObj = find(response.body.data, (o) => {
						return o.id === data[vendor]![index]!.id;
					}) as SchemaDateTypesObject;
					expect(responseObj.date).toBe(data[vendor]![index]!.date);
					expect(responseObj.time).toBe(data[vendor]![index]!.time);
					expect(responseObj.datetime).toBe(data[vendor]![index]!.datetime);
					expect(responseObj.timestamp.substring(0, 19)).toBe(
						new Date(data[vendor]![index]!.timestamp).toISOString().substring(0, 19)
					);
				}
			});

			it.each(vendors)('%p returns the correct datetimes', async (vendor) => {
				const url = `http://localhost:${config.envs[vendor]!.PORT!}`;

				const response = await request(url)
					.get(`/items/schema_date_types?fields=*`)
					.set('Authorization', 'Bearer AdminToken')
					.expect('Content-Type', /application\/json/)
					.expect(200);

				expect(response.body.data.length).toBe(sampleDates.length);

				for (let index = 0; index < data[vendor]!.length; index++) {
					const responseObj = find(response.body.data, (o) => {
						return o.id === data[vendor]![index]!.id;
					}) as SchemaDateTypesObject;
					expect(responseObj.date).toBe(data[vendor]![index]!.date);
					expect(responseObj.time).toBe(data[vendor]![index]!.time);
					expect(responseObj.datetime).toBe(data[vendor]![index]!.datetime);
					expect(responseObj.timestamp.substring(0, 19)).toBe(
						new Date(data[vendor]![index]!.timestamp).toISOString().substring(0, 19)
					);
				}
			});
		});
	});
});
