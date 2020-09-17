import Knex from 'knex';
import run from '../../../database/seeds/run';

export default async function start() {
	const database = require('../../../database/index').default as Knex;
	await run(database);
	database.destroy();
}
