import getDatabase from '../../../database';
import logger from '../../../logger';

export async function apply(): Promise<void> {
	const database = getDatabase();

	try {
		database.destroy();
		process.exit(0);
	} catch (err: any) {
		logger.error(err);
		database.destroy();
		process.exit(1);
	}
}
