import getDatabase from '../../../database';
import logger from '../../../logger';

export default async function count(collection: string): Promise<void> {
	const database = getDatabase();

	if (!collection) {
		logger.error('Collection is required');
		process.exit(1);
	}

	try {
		const records = await database(collection).count('*', { as: 'count' });
		const count = Number(records[0].count);

		process.stdout.write(`${count}\n`);
		database.destroy();
		process.exit(0);
	} catch (err: any) {
		logger.error(err);
		database.destroy();
		process.exit(1);
	}
}
