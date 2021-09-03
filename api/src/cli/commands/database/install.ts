import runMigrations from '../../../database/migrations/run';
import installSeeds from '../../../database/seeds/run';
import getDatabase from '../../../database';
import logger from '../../../logger';

export default async function start(): Promise<void> {
	const database = getDatabase();

	try {
		await installSeeds(database);
		await runMigrations(database, 'latest');
		database.destroy();
		process.exit(0);
	} catch (err: any) {
		logger.error(err);
		database.destroy();
		process.exit(1);
	}
}
