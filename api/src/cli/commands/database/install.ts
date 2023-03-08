import installSeeds from '../../../database/seeds/run';
import getDatabase, { isInstalled } from '../../../database';
import logger from '../../../logger';
import { waitForDatabase } from '../../commands/bootstrap';
import { Knex } from 'knex';
import bootstrap from '../../commands/bootstrap';

export default async function start({
	ignoreAlreadyInstalled = false,
	bootstrapWithSystemMigrations = false,
	skipAdminInit,
}: {
	ignoreAlreadyInstalled?: boolean;
	bootstrapWithSystemMigrations?: boolean;
	skipAdminInit?: boolean;
}): Promise<void> {
	const database: Knex = getDatabase();

	try {
		await waitForDatabase(database);
		if ((await isInstalled()) === true) {
			if (ignoreAlreadyInstalled) {
				logger.info('The database is already installed');
			}
			database.destroy();
			process.exit(0);
		}

		if (bootstrapWithSystemMigrations) {
			bootstrap({ skipAdminInit });
		} else {
			logger.info('Skipping system migrations...');
			await installSeeds(database);
		}

		database.destroy();
		process.exit(0);
	} catch (err: any) {
		logger.error(err);
		database.destroy();
		process.exit(1);
	}
}
