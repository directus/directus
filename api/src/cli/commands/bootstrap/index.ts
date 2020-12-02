import env from '../../../env';
import logger from '../../../logger';
import installDatabase from '../../../database/seeds/run';
import runMigrations from '../../../database/migrations/run';
import { nanoid } from 'nanoid';

export default async function bootstrap() {
	logger.info('Initializing bootstrap...');

	if ((await isDatabaseAvailable()) === false) {
		logger.error(`Can't connect to the database`);
		process.exit(1);
	}

	const { isInstalled, default: database, schemaInspector } = require('../../../database');
	const { RolesService } = require('../../../services/roles');
	const { UsersService } = require('../../../services/users');

	if ((await isInstalled()) === false) {
		logger.info('Installing Directus system tables...');

		await installDatabase(database);

		const schema = await schemaInspector.overview();

		logger.info('Setting up first admin role...');
		const rolesService = new RolesService({ schema });
		const role = await rolesService.create({ name: 'Admin', admin_access: true });

		logger.info('Adding first admin user...');
		const usersService = new UsersService({ schema });

		let adminEmail = env.ADMIN_EMAIL;

		if (!adminEmail) {
			logger.info('No admin email provided. Defaulting to "admin@example.com"');
			adminEmail = 'admin@example.com';
		}

		let adminPassword = env.ADMIN_PASSWORD;

		if (!adminPassword) {
			adminPassword = nanoid(12);
			logger.info(`No admin password provided. Defaulting to "${adminPassword}"`);
		}

		await usersService.create({ email: adminEmail, password: adminPassword, role });
	} else {
		logger.info('Database already initialized, skipping install');
	}

	logger.info('Running migrations...');
	await runMigrations(database, 'latest');

	logger.info('Done');
	process.exit(0);
}

async function isDatabaseAvailable() {
	const { hasDatabaseConnection } = require('../../../database');

	const tries = 5;
	const secondsBetweenTries = 5;

	for (var i = 0; i < tries; i++) {
		if (await hasDatabaseConnection()) {
			return true;
		}

		await new Promise((resolve) => setTimeout(resolve, secondsBetweenTries * 1000));
	}

	return false;
}
