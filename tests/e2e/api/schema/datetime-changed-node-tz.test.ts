import config from '../../config';
import vendors from '../../get-dbs-to-test';
import request from 'supertest';
import knex, { Knex } from 'knex';
import { find } from 'lodash';
import { spawn, ChildProcess } from 'child_process';
import { sleep } from '../../setup/utils/sleep';

type SchemaDateTypesObject = {
	id: number;
	date: string;
	time: string;
	datetime: string;
	timestamp: string;
};

describe('schema', () => {
	const databases = new Map<string, Knex>();
	const tzDirectus = {} as { [vendor: string]: ChildProcess };

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
		const isWindows = ['win32', 'win64'].includes(process.platform);
		const currentTzOffset = new Date().getTimezoneOffset();

		// Different timezone format for windows
		const newTz = isWindows
			? String(currentTzOffset !== 180 ? 180 * 60 : 360 * 60)
			: currentTzOffset !== 180
			? 'America/Sao_Paulo'
			: 'America/Mexico_City';

		for (const vendor of vendors) {
			databases.set(vendor, knex(config.knexConfig[vendor]!));

			config.envs[vendor]!.TZ = newTz;
			config.envs[vendor]!.PORT = String(Number(config.envs[vendor]!.PORT) + 100);

			const server = spawn('node', ['api/cli', 'start'], { env: config.envs[vendor] });
			tzDirectus[vendor] = server;

			let serverOutput = '';
			server.stdout.on('data', (data) => (serverOutput += data.toString()));
			server.on('exit', (code) => {
				if (code !== null) throw new Error(`Directus-${vendor} server failed: \n ${serverOutput}`);
			});
		}

		// Give the server some time to start
		return await sleep(5000);
	}, 10000);

	afterAll(async () => {
		for (const [vendor, connection] of databases) {
			tzDirectus[vendor]!.kill();

			config.envs[vendor]!.PORT = String(Number(config.envs[vendor]!.PORT) - 100);
			delete config.envs[vendor]!.TZ;

			await connection.destroy();
		}
	});

	describe('Date Types (Changed Node Timezone)', () => {
		it.each(vendors)('%p returns the correct datetimes', async (vendor) => {
			const url = `http://localhost:${config.envs[vendor]!.PORT!}`;

			const response = await request(url)
				.get(`/items/schema_date_types?fields=*`)
				.set('Authorization', 'Bearer AdminToken')
				.expect('Content-Type', /application\/json/)
				.expect(200);

			expect(response.body.data.length).toBe(sampleDates.length);

			for (let index = 0; index < sampleDates.length; index++) {
				const responseObj = find(response.body.data, (o) => {
					return o.id === sampleDates[index]!.id;
				}) as SchemaDateTypesObject;
				expect(responseObj.date).toBe(sampleDates[index]!.date);
				expect(responseObj.time).toBe(sampleDates[index]!.time);
				expect(responseObj.datetime).toBe(sampleDates[index]!.datetime);
				expect(responseObj.timestamp.substring(0, 19)).toBe(
					new Date(sampleDates[index]!.timestamp).toISOString().substring(0, 19)
				);
			}
		});
	});
});
