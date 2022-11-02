import { getUrl } from '@common/config';
import vendors from '@common/get-dbs-to-test';
import request from 'supertest';
import { cloneDeep } from 'lodash';
import { validateDateDifference } from '@utils/validate-date-difference';
import { CreateCollection, CreateField, DeleteCollection } from '@common/functions';
import * as common from '@common/index';
import { sleep } from '@utils/sleep';

const collectionName = 'schema_timezone_tests';

type SchemaTimezoneTypesObject = {
	date: string;
	time?: string;
	datetime: string;
	timestamp: string;
};

type SchemaTimezoneTypesResponse = SchemaTimezoneTypesObject & {
	date_created: string;
	date_updated: string;
};

describe('schema', () => {
	const sampleDates: SchemaTimezoneTypesObject[] = [];

	for (let i = 0; i < 24; i++) {
		const hour = i < 10 ? '0' + i : String(i);
		sampleDates.push(
			{
				date: `2022-01-05`,
				time: `${hour}:11:11`,
				datetime: `2022-01-05T${hour}:11:11`,
				timestamp: `2022-01-05T${hour}:11:11-01:00`,
			},
			{
				date: `2022-01-10`,
				time: `${hour}:22:22`,
				datetime: `2022-01-10T${hour}:22:22`,
				timestamp: `2022-01-10T${hour}:22:22Z`,
			},
			{
				date: `2022-01-15`,
				time: `${hour}:33:33`,
				datetime: `2022-01-15T${hour}:33:33`,
				timestamp: `2022-01-15T${hour}:33:33+02:00`,
			}
		);
	}

	describe('timezone', () => {
		describe('update timezone field schema', () => {
			common.DisableTestCachingSetup();

			it.each(vendors)(
				'%s',
				async (vendor) => {
					// Delete the table in case it already exists
					await DeleteCollection(vendor, { collection: collectionName });

					const tableOptions = {
						collection: collectionName,
						schema: {},
						meta: {},
					};
					await CreateCollection(vendor, tableOptions);

					const fieldOptions = {
						collection: collectionName,
						field: 'date',
						meta: {},
						schema: {},
						type: 'date',
					};
					await CreateField(vendor, fieldOptions);

					fieldOptions.field = 'time';
					fieldOptions.type = 'time';
					await CreateField(vendor, fieldOptions);

					fieldOptions.field = 'datetime';
					fieldOptions.type = 'dateTime';
					await CreateField(vendor, fieldOptions);

					fieldOptions.field = 'timestamp';
					fieldOptions.type = 'timestamp';
					await CreateField(vendor, fieldOptions);

					fieldOptions.field = 'date_created';
					fieldOptions.type = 'timestamp';
					await CreateField(vendor, fieldOptions);

					fieldOptions.field = 'date_updated';
					fieldOptions.type = 'timestamp';
					await CreateField(vendor, fieldOptions);

					await request(getUrl(vendor))
						.patch(`/collections/${collectionName}`)
						.send({
							meta: {},
						})
						.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`)
						.expect('Content-Type', /application\/json/)
						.expect(200);

					await request(getUrl(vendor))
						.patch(`/fields/${collectionName}/date_created`)
						.send({
							meta: {
								special: ['date-created'],
							},
						})
						.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`)
						.expect('Content-Type', /application\/json/)
						.expect(200);

					await request(getUrl(vendor))
						.patch(`/fields/${collectionName}/date_updated`)
						.send({
							meta: {
								special: ['date-updated'],
							},
						})
						.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`)
						.expect('Content-Type', /application\/json/)
						.expect(200);

					switch (vendor) {
						case 'sqlite3':
							await request(getUrl(vendor))
								.patch(`/fields/${collectionName}/timestamp`)
								.send({
									meta: {
										special: ['cast-timestamp'],
									},
								})
								.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`)
								.expect('Content-Type', /application\/json/)
								.expect(200);
							await request(getUrl(vendor))
								.patch(`/fields/${collectionName}/date_created`)
								.send({
									meta: {
										special: ['date-created', 'cast-timestamp'],
									},
								})
								.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`)
								.expect('Content-Type', /application\/json/)
								.expect(200);

							await request(getUrl(vendor))
								.patch(`/fields/${collectionName}/date_updated`)
								.send({
									meta: {
										special: ['date-updated', 'cast-timestamp'],
									},
								})
								.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`)
								.expect('Content-Type', /application\/json/)
								.expect(200);
							break;
						case 'oracle':
							await request(getUrl(vendor))
								.patch(`/fields/${collectionName}/datetime`)
								.send({
									meta: {
										special: ['cast-datetime'],
									},
								})
								.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`)
								.expect('Content-Type', /application\/json/)
								.expect(200);
							break;
						default:
							break;
					}
				},
				300000
			);
		});

		common.ClearCaches();

		describe('stores the correct timezone data', () => {
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
						.post(`/items/${collectionName}`)
						.send(dates)
						.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`)
						.expect('Content-Type', /application\/json/)
						.expect(200);

					const insertionEndTimestamp = new Date();

					const response = await request(getUrl(vendor))
						.get(`/items/${collectionName}?fields=*`)
						.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`)
						.expect('Content-Type', /application\/json/)
						.expect(200);

					expect(response.body.data.length).toBe(sampleDates.length);

					for (let index = 0; index < sampleDates.length; index++) {
						const responseObj = response.body.data[index] as SchemaTimezoneTypesResponse;

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

		describe('stores the correct timezone data when updated', () => {
			it.each(vendors)('%s', async (vendor) => {
				await sleep(1000);

				const payload = {
					date: sampleDates[0]!.date,
				};

				const existingDataResponse = await request(getUrl(vendor))
					.get(`/items/${collectionName}?fields=*&limit=1`)
					.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`)
					.expect('Content-Type', /application\/json/)
					.expect(200);

				const updateStartTimestamp = new Date();

				await request(getUrl(vendor))
					.patch(`/items/${collectionName}/${existingDataResponse.body.data[0].id}`)
					.send(payload)
					.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`)
					.expect('Content-Type', /application\/json/)
					.expect(200);

				const updateEndTimestamp = new Date();

				const response = await request(getUrl(vendor))
					.get(`/items/${collectionName}/${existingDataResponse.body.data[0].id}?fields=*`)
					.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`)
					.expect('Content-Type', /application\/json/)
					.expect(200);

				const responseObj = response.body.data as SchemaTimezoneTypesResponse;

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
	});
});
