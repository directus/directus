/* eslint-disable no-console */

import knex from 'knex';
import Listr from 'listr';
import vendors from '../get-dbs-to-test';
import config from '../config';
import global from './global';
import { spawn, spawnSync } from 'child_process';
import { awaitDatabaseConnection, awaitDirectusConnection } from './utils/await-connection';
import { sleep } from './utils/sleep';

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
								const env = config.envs[vendor]!;
								const bootstrap = spawnSync('node', ['api/cli', 'bootstrap'], { env });
								if (bootstrap.stderr.length > 0) {
									throw new Error(`Directus-${vendor} bootstrap failed: \n ${bootstrap.stderr.toString()}`);
								}
								await database.migrate.latest();
								await database.seed.run();
								await database.destroy();
								const server = spawn('node', ['api/cli', 'start'], { env });
								let serverOutput = '';
								server.stdout.on('data', (data) => (serverOutput += data.toString()));
								server.on('exit', (code) => {
									if (code !== null) throw new Error(`Directus-${vendor} server failed: \n ${serverOutput}`);
								});
								await sleep(5000);
								server.on('exit', () => undefined);
								try {
									await awaitDirectusConnection(Number(config.envs[vendor]!.PORT));
									global.directus[vendor] = server;
								} catch (error: any) {
									server.kill();
									throw new Error(`Directus-${vendor} server failed: \n ${error.message}`);
								}
								global.directus[vendor] = server;
							},
						};
					}),
					{ concurrent: true }
				);
			},
		},
	]).run();

	console.log('\n');
};
