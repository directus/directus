import Knex from 'knex';
import run from '../../../database/seeds/run';

export default async function start() {
	const database = require('../../../database/index').default as Knex;
	try {
		await run(database);
	} catch (err) {
		console.log(err);
		process.exit(1);
	} finally {
		database.destroy();
	}
}
