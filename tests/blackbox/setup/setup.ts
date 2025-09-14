/* eslint-disable no-console */
import axios from 'axios';
import { spawn, spawnSync } from 'child_process';
import knex from 'knex';
import { Listr } from 'listr2';
import { clone } from 'lodash-es';
import fs from 'node:fs';
import { join } from 'node:path';
import config, { getUrl, paths } from '../common/config';
import vendors from '../common/get-dbs-to-test';
import { USER } from '../common/variables';
import { awaitDatabaseConnection, awaitDirectusConnection } from '../utils/await-connection';
import global from './global';

export async function setup() {
	console.log(`👮‍♀️ Starting tests!\n`);

	await new Listr([
		{
			title: 'Bootstrap databases and start servers',
			task: async () => {
				return new Listr(
					vendors.map((vendor) => {
						return {
							title: config.names[vendor],
							task: async () => {

								try {
									const database = knex(config.knexConfig[vendor]);
									await awaitDatabaseConnection(database, config.knexConfig[vendor].waitTestSQL);

									if (vendor === 'sqlite3') {
										fs.writeFileSync(join(paths.cwd, 'test.db'), '');
									}

									const bootstrap = spawnSync('node', [paths.cli, 'bootstrap'], {
										cwd: paths.cwd,
										env: config.envs[vendor],
									});

									if (bootstrap.status !== null && bootstrap.status !== 0) {
										throw new Error(
											`Directus-${vendor} bootstrap failed (${bootstrap.status}): \n ${bootstrap.stderr.toString()}`,
										);
									}

									await database.migrate.latest();
									await database.seed.run();
									await database.destroy();

									if (!process.env['TEST_LOCAL']) {
										const server = spawn('node', [paths.cli, 'start'], {
											cwd: paths.cwd,
											env: config.envs[vendor],
										});

										global.directus[vendor] = server;
										server.stdout.setEncoding('utf8');

										const logFilePath = join(paths.cwd, `server-log-${vendor}.txt`);
										console.log(`Saving server logs to ${logFilePath}`);

										const logFile = process.env['TEST_SAVE_LOGS']
										? fs.openSync(logFilePath, 'w')
										: null;

										if (logFile) {
											fs.writeFileSync(logFile, '');
										}

										server.stdout.on('data', (data) => {
											if (logFile) {
												fs.appendFileSync(logFile, data);
											}
										});

										server.stderr.on('data', (data) => {
											console.log(data.toString());
										});

										server.on('exit', async (code) => {
											if (logFile){
												fs.closeSync(logFile);
											}

											if (code !== null)
												throw new Error(`Directus-${vendor} server failed (${code}): \n Logs in ${logFilePath}`);
										});

										// Give the server some time to start
										await awaitDirectusConnection(Number(config.envs[vendor].PORT));

										// Set up separate directus instance without system cache
										const noCacheEnv = clone(config.envs[vendor]);
										noCacheEnv['CACHE_SCHEMA'] = 'false';
										noCacheEnv['PORT'] = String(parseInt(noCacheEnv.PORT) + 50);
										const serverNoCache = spawn('node', [paths.cli, 'start'], { cwd: paths.cwd, env: noCacheEnv });
										global.directusNoCache[vendor] = serverNoCache;
										serverNoCache.stdout.setEncoding('utf8');

										const logFilePathNoCache = join(paths.cwd, `server-log-${vendor}-no-cache.txt`);
										console.log(`Saving no-cache server logs to ${logFilePathNoCache}`);

										const logFileNoCache = process.env['TEST_SAVE_LOGS']
										? fs.openSync(logFilePathNoCache, 'w')
										: null;

										if (logFileNoCache) {
											fs.writeFileSync(logFileNoCache, '');
										}

										serverNoCache.stdout.on('data', (data) => {
											if (logFileNoCache) {
												fs.appendFileSync(logFileNoCache, data);
											}
										});

										serverNoCache.on('exit', async (code) => {
											if (logFileNoCache) {
												fs.closeSync(logFileNoCache);
											}

											if (code !== null) {
												throw new Error(`Directus-${vendor}-no-cache server failed (${code}): \n Logs in ${logFilePathNoCache}`);
											}
										});

										// Give the server some time to start
										await awaitDirectusConnection(Number(noCacheEnv['PORT']));
									}
								} catch (error) {
									console.error(error);
									throw error;
								}
							},
						};
					}),
					{ concurrent: true, rendererOptions: { collapseErrors: false } },
				);
			},
		},
		{
			title: 'Test server connectivity',
			task: async () => {
				for (const vendor of vendors) {
					try {
						const serverUrl = getUrl(vendor);

						const response = await axios.get(
							`${serverUrl}/items/tests_flow_data?access_token=${USER.TESTS_FLOW.TOKEN}`,
						);

						if (response.status === 200) {
							process.env['serverUrl'] = serverUrl;
							break;
						}
					} catch {
						continue;
					}
				}

				if (!process.env['serverUrl']) {
					throw new Error('Unable to connect to any Directus server');
				}
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
}

export async function teardown() {
	try {
		fs.unlinkSync('sequencer-data.json');
	} catch {
		// Ignore
	}

	if (!process.env['TEST_LOCAL']) {
		await new Listr([
			{
				title: 'Stop Directus servers',
				task: () => {
					return new Listr(
						vendors.map((vendor) => {
							return {
								title: config.names[vendor]!,
								task: async () => {
									const directus = global.directus[vendor];
									directus?.kill();

									const directusNoCache = global.directusNoCache[vendor];
									directusNoCache?.kill();
								},
							};
						}),
						{ concurrent: true, exitOnError: false },
					);
				},
			},
		]).run();
	}

	console.log('\n');

	console.log(`👮‍♀️ Tests complete!\n`);
}
