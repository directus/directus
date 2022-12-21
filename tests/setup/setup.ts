/* eslint-disable no-console */

import knex from 'knex';
import { Listr } from 'listr2';
import vendors from '../get-dbs-to-test';
import config, { getUrl } from '../config';
import global from './global';
import { spawn, spawnSync } from 'child_process';
import axios from 'axios';
import { writeFileSync } from 'fs';
import { awaitDatabaseConnection, awaitDirectusConnection } from './utils/await-connection';

let started = false;

export default async (): Promise<void> => {
	if (started) return;
	started = true;

	console.log('\n\n');

	console.log(`👮‍♀️ Starting tests!\n`);

	await new Listr([
		{
			title: 'Bootstrap databases and start servers',
			task: async () => {
				return new Listr(
					vendors.map((vendor) => {
						return {
							title: config.names[vendor]!,
							task: async () => {
								const database = knex(config.knexConfig[vendor]!);
								await awaitDatabaseConnection(database, config.knexConfig[vendor]!.waitTestSQL);
								if (vendor === 'sqlite3') {
									writeFileSync('test.db', '');
								}
								const bootstrap = spawnSync('node', ['api/cli', 'bootstrap'], { env: config.envs[vendor] });
								if (bootstrap.stderr.length > 0) {
									throw new Error(`Directus-${vendor} bootstrap failed: \n ${bootstrap.stderr.toString()}`);
								}
								await database.migrate.latest();
								await database.seed.run();
								await database.destroy();

								if (!process.env.TEST_LOCAL) {
									const server = spawn('node', ['api/cli', 'start'], { env: config.envs[vendor] });
									global.directus[vendor] = server;
									let serverOutput = '';
									server.stdout.on('data', (data) => (serverOutput += data.toString()));
									server.on('exit', (code) => {
										if (code !== null) throw new Error(`Directus-${vendor} server failed: \n ${serverOutput}`);
									});
									// Give the server some time to start
									await awaitDirectusConnection(Number(config.envs[vendor]!.PORT!));
									server.on('exit', () => undefined);
								}
							},
						};
					}),
					{ concurrent: true }
				);
			},
		},
		{
			title: 'Setup test data flow',
			task: async () => {
				return new Listr([
					{
						title: 'Testing server connectivity and bootstrap tests flow',
						task: async () => {
							const totalTestsCount = Number(process.env.totalTestsCount);
							if (isNaN(totalTestsCount)) {
								throw 'Unable to read totalTestsCount';
							}

							for (const vendor of vendors) {
								try {
									const serverUrl = getUrl(vendor);
									let response = await axios.get(`${serverUrl}/items/tests_flow_data?access_token=AdminToken`);

									if (response.status !== 200) {
										continue;
									}

									const body = {
										total_tests_count: totalTestsCount,
									};
									response = await axios.post(`${serverUrl}/items/tests_flow_data`, body, {
										headers: {
											Authorization: 'Bearer AdminToken',
											'Content-Type': 'application/json',
										},
									});

									if (response.status === 200) {
										process.env.serverUrl = serverUrl;
										break;
									}
								} catch (err) {
									continue;
								}
							}

							if (!process.env.serverUrl) {
								throw 'Unable to connect to any directus server';
							}
						},
					},
				]);
			},
		},
	])
		.run()
		.catch((reason) => {
			for (const server of Object.values(global.directus)) {
				server?.kill();
			}
			throw new Error(reason);
		});

	console.log('\n');
};
