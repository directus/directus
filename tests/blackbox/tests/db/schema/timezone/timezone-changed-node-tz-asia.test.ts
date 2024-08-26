import config, { getUrl, paths } from '@common/config';
import vendors, { type Vendor } from '@common/get-dbs-to-test';
import { USER } from '@common/variables';
import { awaitDirectusConnection } from '@utils/await-connection';
import { sleep } from '@utils/sleep';
import { validateDateDifference } from '@utils/validate-date-difference';
import { ChildProcess, spawn } from 'child_process';
import getPort from 'get-port';
import type { Knex } from 'knex';
import knex from 'knex';
import { cloneDeep } from 'lodash-es';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

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
	const databases = new Map<Vendor, Knex>();
	const tzDirectus = {} as Record<Vendor, ChildProcess>;
	const env = cloneDeep(config.envs);
	const currentTzOffset = new Date().getTimezoneOffset();
	const isWindows = ['win32', 'win64'].includes(process.platform);

	const newTzOffset = currentTzOffset !== -540 ? -540 : -240;
	let newTz: string;

	// Different timezone format for Windows
	if (isWindows) {
		newTz = String(newTzOffset * 60);
	} else if (newTzOffset === -540) {
		newTz = 'Asia/Seoul';
	} else {
		newTz = 'Asia/Dubai';
	}

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
			},
		);
	}

	beforeAll(async () => {
		const promises = [];

		for (const vendor of vendors) {
			databases.set(vendor, knex(config.knexConfig[vendor]!));

			const newServerPort = await getPort();

			env[vendor]['TZ'] = newTz;
			env[vendor].PORT = String(newServerPort);

			const server = spawn('node', [paths.cli, 'start'], { cwd: paths.cwd, env: env[vendor] });
			tzDirectus[vendor] = server;

			promises.push(awaitDirectusConnection(newServerPort));
		}

		// Give the server some time to start
		await Promise.all(promises);
	}, 180000);

	afterAll(async () => {
		for (const [vendor, connection] of databases) {
			tzDirectus[vendor].kill();

			await connection.destroy();
		}
	});

	describe('timezone (Changed Node Timezone Asia)', () => {
		describe('returns existing timezone data correctly', () => {
			it.each(vendors)('%s', async (vendor) => {
				const currentTimestamp = new Date();

				const response = await request(getUrl(vendor, env))
					.get(`/items/${collectionName}?fields=*&limit=${sampleDates.length}`)
					.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`)
					.expect('Content-Type', /application\/json/)
					.expect(200);

				expect(response.body.data.length).toBe(sampleDates.length);

				for (let index = 0; index < sampleDates.length; index++) {
					const responseObj = response.body.data[index] as SchemaTimezoneTypesResponse;

					if (vendor === 'sqlite3') {
						// Dates are saved in milliseconds at 00:00:00
						const newDateString = new Date(
							new Date(sampleDates[index]!.date + 'T00:00:00+00:00').valueOf() - newTzOffset * 60 * 1000,
						).toISOString();

						const newDateTimeString = new Date(
							new Date(sampleDates[index]!.datetime + '+00:00').valueOf() - newTzOffset * 60 * 1000,
						).toISOString();

						expect(responseObj.date).toBe(newDateString.substring(0, 10));
						expect(responseObj.time).toBe(sampleDates[index]!.time);
						expect(responseObj.datetime).toBe(newDateTimeString.substring(0, 19));

						expect(responseObj.timestamp.substring(0, 19)).toBe(
							new Date(sampleDates[index]!.timestamp).toISOString().substring(0, 19),
						);

						const dateCreated = new Date(responseObj.date_created);

						expect(dateCreated.toISOString()).toBe(
							validateDateDifference(currentTimestamp, dateCreated, 400000).toISOString(),
						);

						continue;
					} else if (vendor === 'oracle') {
						expect(responseObj.date).toBe(sampleDates[index]!.date);
						expect(responseObj.datetime).toBe(sampleDates[index]!.datetime);

						expect(responseObj.timestamp.substring(0, 19)).toBe(
							new Date(sampleDates[index]!.timestamp).toISOString().substring(0, 19),
						);

						const dateCreated = new Date(responseObj.date_created);

						expect(dateCreated.toISOString()).toBe(
							validateDateDifference(currentTimestamp, dateCreated, 400000).toISOString(),
						);

						continue;
					}

					expect(responseObj.date).toBe(sampleDates[index]!.date);
					expect(responseObj.time).toBe(sampleDates[index]!.time);
					expect(responseObj.datetime).toBe(sampleDates[index]!.datetime);

					expect(responseObj.timestamp.substring(0, 19)).toBe(
						new Date(sampleDates[index]!.timestamp).toISOString().substring(0, 19),
					);

					const dateCreated = new Date(responseObj.date_created);

					expect(dateCreated.toISOString()).toBe(
						validateDateDifference(currentTimestamp, dateCreated, 200000).toISOString(),
					);
				}

				const americanTzOffset = currentTzOffset !== 180 ? 180 : 360;

				const response2 = await request(getUrl(vendor, env))
					.get(`/items/${collectionName}?fields=*&offset=${sampleDates.length}`)
					.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`)
					.expect('Content-Type', /application\/json/)
					.expect(200);

				expect(response2.body.data.length).toBe(sampleDates.length);

				for (let index = 0; index < sampleDates.length; index++) {
					const responseObj = response2.body.data[index] as SchemaTimezoneTypesResponse;

					if (vendor === 'sqlite3') {
						// Dates are saved in milliseconds at 00:00:00
						const newDateString = new Date(
							new Date(sampleDates[index]!.date + 'T00:00:00+00:00').valueOf() -
								(newTzOffset - americanTzOffset) * 60 * 1000,
						).toISOString();

						const newDateTimeString = new Date(
							new Date(sampleDates[index]!.datetime + '+00:00').valueOf() -
								(newTzOffset - americanTzOffset) * 60 * 1000,
						).toISOString();

						expect(responseObj.date).toBe(newDateString.substring(0, 10));
						expect(responseObj.time).toBe(sampleDates[index]!.time);
						expect(responseObj.datetime).toBe(newDateTimeString.substring(0, 19));

						expect(responseObj.timestamp.substring(0, 19)).toBe(
							new Date(sampleDates[index]!.timestamp).toISOString().substring(0, 19),
						);

						const dateCreated = new Date(responseObj.date_created);

						expect(dateCreated.toISOString()).toBe(
							validateDateDifference(currentTimestamp, dateCreated, 200000).toISOString(),
						);

						continue;
					} else if (vendor === 'oracle') {
						expect(responseObj.date).toBe(sampleDates[index]!.date);
						expect(responseObj.datetime).toBe(sampleDates[index]!.datetime);

						expect(responseObj.timestamp.substring(0, 19)).toBe(
							new Date(sampleDates[index]!.timestamp).toISOString().substring(0, 19),
						);

						const dateCreated = new Date(responseObj.date_created);

						expect(dateCreated.toISOString()).toBe(
							validateDateDifference(currentTimestamp, dateCreated, 200000).toISOString(),
						);

						continue;
					}

					expect(responseObj.date).toBe(sampleDates[index]!.date);
					expect(responseObj.time).toBe(sampleDates[index]!.time);
					expect(responseObj.datetime).toBe(sampleDates[index]!.datetime);

					expect(responseObj.timestamp.substring(0, 19)).toBe(
						new Date(sampleDates[index]!.timestamp).toISOString().substring(0, 19),
					);

					const dateCreated = new Date(responseObj.date_created);

					expect(dateCreated.toISOString()).toBe(
						validateDateDifference(currentTimestamp, dateCreated, 200000).toISOString(),
					);
				}
			});
		});

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

					await request(getUrl(vendor, env))
						.post(`/items/${collectionName}`)
						.send(dates)
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`)
						.expect('Content-Type', /application\/json/)
						.expect(200);

					const insertionEndTimestamp = new Date();

					const response = await request(getUrl(vendor, env))
						.get(`/items/${collectionName}?fields=*&offset=${sampleDates.length * 2}`)
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`)
						.expect('Content-Type', /application\/json/)
						.expect(200);

					expect(response.body.data.length).toBe(sampleDates.length);

					for (let index = 0; index < sampleDates.length; index++) {
						const responseObj = response.body.data[index] as SchemaTimezoneTypesResponse;

						if (vendor === 'oracle') {
							expect(responseObj.date).toBe(sampleDates[index]!.date);
							expect(responseObj.datetime).toBe(sampleDates[index]!.datetime);

							expect(responseObj.timestamp.substring(0, 19)).toBe(
								new Date(sampleDates[index]!.timestamp).toISOString().substring(0, 19),
							);

							const dateCreated = new Date(responseObj.date_created);

							expect(dateCreated.toISOString()).toBe(
								validateDateDifference(
									insertionStartTimestamp,
									dateCreated,
									insertionEndTimestamp.getTime() - insertionStartTimestamp.getTime(),
								).toISOString(),
							);

							expect(responseObj.date_updated).toBeNull();
							continue;
						}

						expect(responseObj.date).toBe(sampleDates[index]!.date);
						expect(responseObj.time).toBe(sampleDates[index]!.time);
						expect(responseObj.datetime).toBe(sampleDates[index]!.datetime);

						expect(responseObj.timestamp.substring(0, 19)).toBe(
							new Date(sampleDates[index]!.timestamp).toISOString().substring(0, 19),
						);

						const dateCreated = new Date(responseObj.date_created);

						expect(dateCreated.toISOString()).toBe(
							validateDateDifference(
								insertionStartTimestamp,
								dateCreated,
								insertionEndTimestamp.getTime() - insertionStartTimestamp.getTime() + 1000,
							).toISOString(),
						);

						expect(responseObj.date_updated).toBeNull();
					}
				},
				10000,
			);
		});

		describe('stores the correct timezone data when updated', () => {
			it.each(vendors)('%s', async (vendor) => {
				await sleep(1000);

				const payload = {
					date: sampleDates[0]!.date,
				};

				const existingDataResponse = await request(getUrl(vendor, env))
					.get(`/items/${collectionName}?fields=*&limit=1&offset=${sampleDates.length * 2}`)
					.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`)
					.expect('Content-Type', /application\/json/)
					.expect(200);

				const updateStartTimestamp = new Date();

				await request(getUrl(vendor, env))
					.patch(`/items/${collectionName}/${existingDataResponse.body.data[0].id}`)
					.send(payload)
					.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`)
					.expect('Content-Type', /application\/json/)
					.expect(200);

				const updateEndTimestamp = new Date();

				const response = await request(getUrl(vendor, env))
					.get(`/items/${collectionName}/${existingDataResponse.body.data[0].id}?fields=*`)
					.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`)
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
						updateEndTimestamp.getTime() - updateStartTimestamp.getTime() + 1000,
					).toISOString(),
				);
			});
		});
	});
});
