import Knex from 'knex';
import installSeeds from '../../../database/seeds/run';
import runMigrations from '../../../database/migrations/run';

export default async function start() {
	const database = require('../../../database/index').default as Knex;

	try {
		await installSeeds(database);
		await runMigrations(database, 'latest');
	} catch (err) {
		console.log(err);
		process.exit(1);
	} finally {
		database.destroy();
	}
}
