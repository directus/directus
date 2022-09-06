import installSeeds from '../../../database/seeds/run.js';
import getDatabase from '../../../database/index.js';
import logger from '../../../logger.js';

export default async function start(): Promise<void> {
	const database = getDatabase();

	try {
		await installSeeds(database);
		database.destroy();
		process.exit(0);
	} catch (err: any) {
		logger.error(err);
		database.destroy();
		process.exit(1);
	}
}
