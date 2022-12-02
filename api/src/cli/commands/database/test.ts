import run from '../../../database/migrations/run';
import getDatabase, { validateDatabaseConnection, isInstalled } from '../../../database';
import logger from '../../../logger';
import { Migration } from '../../../types';

export default async function test(kind: 'connection' | 'installed' | 'version' | 'migrations'): Promise<void> {
	const database = getDatabase();

	try {
		logger.info('Testing database...');

		if (kind === 'connection') {
			await validateDatabaseConnection(database);
			logger.info('CONNECTED');
		} else if (kind === 'installed') {
			const installed = await isInstalled();
			logger.info(installed ? 'INSTALLED' : 'NOT installed');
		} else if (kind === 'version') {
			const completedMigrations = await database
				.select<Migration[]>('*')
				.from('directus_migrations')
				.orderBy('version');

			logger.trace('version %o', completedMigrations);
			const currentVersion = completedMigrations[completedMigrations.length - 1];
			logger.info('version %o', currentVersion);
		} else if (kind === 'migrations') {
			await run(database, 'available');
		}

		await database.destroy();
		process.exit();
	} catch (err: any) {
		logger.error(err);
		await database.destroy();
		process.exit(1);
	}
}
