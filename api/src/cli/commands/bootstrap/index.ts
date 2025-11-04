import { useEnv } from '@directus/env';
import type { Knex } from 'knex';
import getDatabase, {
	hasDatabaseConnection,
	isInstalled,
	validateDatabaseConnection,
} from '../../../database/index.js';
import runMigrations from '../../../database/migrations/run.js';
import installDatabase from '../../../database/seeds/run.js';
import { useLogger } from '../../../logger/index.js';
import { SettingsService } from '../../../services/settings.js';
import { getSchema } from '../../../utils/get-schema.js';
import { createAdmin } from '../../../utils/create-admin.js';
import { email } from 'zod';

export default async function bootstrap({ skipAdminInit }: { skipAdminInit?: boolean }): Promise<void> {
	const logger = useLogger();

	logger.info('Initializing bootstrap...');

	const env = useEnv();

	const database = getDatabase();

	await waitForDatabase(database);

	if ((await isInstalled()) === false) {
		logger.info('Installing Directus system tables...');

		await installDatabase(database);

		logger.info('Running migrations...');
		await runMigrations(database, 'latest');

		const schema = await getSchema();

		if (skipAdminInit == null) {
			await createAdmin(schema);
		} else {
			logger.info('Skipping creation of default Admin user and role...');
		}

		const settingsService = new SettingsService({ schema });

		if (env['PROJECT_NAME'] && typeof env['PROJECT_NAME'] === 'string' && env['PROJECT_NAME'].length > 0) {
			await settingsService.upsertSingleton({ project_name: env['PROJECT_NAME'] });
		}

		if (email().safeParse(env['PROJECT_OWNER']).success) {
			await settingsService.setOwner({
				project_owner: env['PROJECT_OWNER'] as string,
				org_name: null,
				project_usage: null,
				product_updates: false,
			});
		}
	} else {
		logger.info('Database already initialized, skipping install');
		logger.info('Running migrations...');
		await runMigrations(database, 'latest');
	}

	await database.destroy();
	logger.info('Done');
	process.exit(0);
}

async function waitForDatabase(database: Knex) {
	const tries = 5;
	const secondsBetweenTries = 5;

	for (let i = 0; i < tries; i++) {
		if (await hasDatabaseConnection(database)) {
			return true;
		}

		await new Promise((resolve) => setTimeout(resolve, secondsBetweenTries * 1000));
	}

	// This will throw and exit the process if the database is not available
	await validateDatabaseConnection(database);

	return database;
}
