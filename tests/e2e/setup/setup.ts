/* eslint-disable no-console */

import knex from 'knex';
import Listr from 'listr';
import vendors from '../get-dbs-to-test';
import config from '../config';
import global from './global';
import { spawn, spawnSync } from 'child_process';
import { sleep } from './utils/sleep';
import { writeFileSync } from 'fs';
import { awaitDatabaseConnection } from './utils/await-connection';

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
								const server = spawn('node', ['api/cli', 'start'], { env: config.envs[vendor] });
								global.directus[vendor] = server;
								let serverOutput = '';
								server.stdout.on('data', (data) => (serverOutput += data.toString()));
								server.on('exit', (code) => {
									if (code !== null) throw new Error(`Directus-${vendor} server failed: \n ${serverOutput}`);
								});
								// Give the server some time to start
								await sleep(5000);
								server.on('exit', () => undefined);
							},
						};
					}),
					{ concurrent: true }
				);
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
