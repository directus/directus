/* eslint-disable no-console */

import axios from 'axios';
import { spawn, spawnSync } from 'child_process';
import { writeFileSync } from 'fs';
import knex from 'knex';
import { Listr } from 'listr2';
import { clone } from 'lodash';
import path from 'node:path';
import * as common from '../common';
import config, { getUrl, paths } from '../common/config';
import vendors from '../common/get-dbs-to-test';
import { awaitDatabaseConnection, awaitDirectusConnection } from '../utils/await-connection';
import global from './global';

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
									writeFileSync(path.join(paths.cwd, 'test.db'), '');
								}

								const bootstrap = spawnSync('node', [paths.cli, 'bootstrap'], {
									cwd: paths.cwd,
									env: config.envs[vendor],
								});

								if (bootstrap.stderr.length > 0) {
									throw new Error(`Directus-${vendor} bootstrap failed: \n ${bootstrap.stderr.toString()}`);
								}

								await database.migrate.latest();
								await database.seed.run();
								await database.destroy();

								if (!process.env.TEST_LOCAL) {
									const server = spawn('node', [paths.cli, 'start'], {
										cwd: paths.cwd,
										env: config.envs[vendor],
									});

									global.directus[vendor] = server;
									let serverOutput = '';
									server.stdout.setEncoding('utf8');

									server.stdout.on('data', (data) => {
										serverOutput += data.toString();
									});

									server.on('exit', (code) => {
										if (process.env.TEST_SAVE_LOGS) {
											writeFileSync(path.join(paths.cwd, `server-log-${vendor}.txt`), serverOutput);
										}

										if (code !== null) throw new Error(`Directus-${vendor} server failed: \n ${serverOutput}`);
									});

									// Give the server some time to start
									await awaitDirectusConnection(Number(config.envs[vendor]!.PORT!));
									server.on('exit', () => undefined);

									// Set up separate directus instance without system cache
									const noCacheEnv = clone(config.envs[vendor]!);
									noCacheEnv.CACHE_SCHEMA = 'false';
									noCacheEnv.PORT = String(parseInt(noCacheEnv.PORT!) + 50);
									const serverNoCache = spawn('node', [paths.cli, 'start'], { cwd: paths.cwd, env: noCacheEnv });
									global.directusNoCache[vendor] = serverNoCache;
									let serverNoCacheOutput = '';
									serverNoCache.stdout.setEncoding('utf8');

									serverNoCache.stdout.on('data', (data) => {
										serverNoCacheOutput += data.toString();
									});

									serverNoCache.on('exit', (code) => {
										if (process.env.TEST_SAVE_LOGS) {
											writeFileSync(__dirname + `/../server-log-${vendor}-no-cache.txt`, serverNoCacheOutput);
										}

										if (code !== null) {
											throw new Error(`Directus-${vendor}-no-cache server failed: \n ${serverNoCacheOutput}`);
										}
									});

									// Give the server some time to start
									await awaitDirectusConnection(Number(noCacheEnv.PORT!));
									serverNoCache.on('exit', () => undefined);
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
								throw new Error('Unable to read totalTestsCount');
							}

							for (const vendor of vendors) {
								try {
									const serverUrl = getUrl(vendor);

									let response = await axios.get(
										`${serverUrl}/items/tests_flow_data?access_token=${common.USER.TESTS_FLOW.TOKEN}`
									);

									if (response.status !== 200) {
										continue;
									}

									const body = {
										total_tests_count: totalTestsCount,
									};

									response = await axios.post(`${serverUrl}/items/tests_flow_data`, body, {
										headers: {
											Authorization: 'Bearer ' + common.USER.TESTS_FLOW.TOKEN,
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
								throw new Error('Unable to connect to any directus server');
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

			for (const serverNoCache of Object.values(global.directusNoCache)) {
				serverNoCache?.kill();
			}

			throw new Error(reason);
		});

	console.log('\n');
};
