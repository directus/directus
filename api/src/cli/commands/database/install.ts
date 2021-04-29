import { Knex } from 'knex';
import installSeeds from '../../../database/seeds/run';
import runMigrations from '../../../database/migrations/run';

export default async function start(): Promise<void> {
	const database = require('../../../database/index').default as Knex;

	try {
		await installSeeds(database);
		await runMigrations(database, 'latest');
		database.destroy();
		process.exit(0);
	} catch (err) {
		console.log(err);
		database.destroy();
		process.exit(1);
	}
}
