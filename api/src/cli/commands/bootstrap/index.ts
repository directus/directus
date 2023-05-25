import type { SchemaOverview } from '@directus/types';
import type { Knex } from 'knex';
import getDatabase, {
	hasDatabaseConnection,
	isInstalled,
	validateDatabaseConnection,
} from '../../../database/index.js';
import runMigrations from '../../../database/migrations/run.js';
import installDatabase from '../../../database/seeds/run.js';
import env from '../../../env.js';
import logger from '../../../logger.js';
import { RolesService } from '../../../services/roles.js';
import { SettingsService } from '../../../services/settings.js';
import { UsersService } from '../../../services/users.js';
import { getSchema } from '../../../utils/get-schema.js';
import { defaultAdminRole, defaultAdminUser } from '../../utils/defaults.js';

export default async function bootstrap({ skipAdminInit }: { skipAdminInit?: boolean }): Promise<void> {
	logger.info('Initializing bootstrap...');

	const database = getDatabase();

	await waitForDatabase(database);

	if ((await isInstalled()) === false) {
		logger.info('Installing Directus system tables...');

		await installDatabase(database);

		logger.info('Running migrations...');
		await runMigrations(database, 'latest');

		const schema = await getSchema();

		if (skipAdminInit == null) {
			await createDefaultAdmin(schema);
		} else {
			logger.info('Skipping creation of default Admin user and role...');
		}

		if (env['PROJECT_NAME'] && typeof env['PROJECT_NAME'] === 'string' && env['PROJECT_NAME'].length > 0) {
			const settingsService = new SettingsService({ schema });
			await settingsService.upsertSingleton({ project_name: env['PROJECT_NAME'] });
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

async function createDefaultAdmin(schema: SchemaOverview) {
	const { nanoid } = await import('nanoid');

	logger.info('Setting up first admin role...');
	const rolesService = new RolesService({ schema });
	const role = await rolesService.createOne(defaultAdminRole);

	logger.info('Adding first admin user...');
	const usersService = new UsersService({ schema });

	let adminEmail = env['ADMIN_EMAIL'];

	if (!adminEmail) {
		logger.info('No admin email provided. Defaulting to "admin@example.com"');
		adminEmail = 'admin@example.com';
	}

	let adminPassword = env['ADMIN_PASSWORD'];

	if (!adminPassword) {
		adminPassword = nanoid(12);
		logger.info(`No admin password provided. Defaulting to "${adminPassword}"`);
	}

	await usersService.createOne({ email: adminEmail, password: adminPassword, role, ...defaultAdminUser });
}
