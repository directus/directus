import { useEnv } from '@directus/env';
import type { SchemaOverview } from '@directus/types';
import { useLogger } from '../logger/index.js';
import { AccessService } from '../services/access.js';
import { UsersService } from '../services/index.js';
import { PoliciesService } from '../services/policies.js';
import { RolesService } from '../services/roles.js';
import type { Policy, Role, User } from '@directus/types';

export const defaultAdminRole: Partial<Role> = {
	name: 'Administrator',
	icon: 'verified',
	description: '$t:admin_description',
};

export const defaultAdminUser: Partial<User> = {
	status: 'active',
	first_name: 'Admin',
	last_name: 'User',
};

export const defaultAdminPolicy: Partial<Policy> = {
	name: 'Administrator',
	icon: 'verified',
	admin_access: true,
	app_access: true,
	description: '$t:admin_description',
};

export async function createAdmin(
	schema: SchemaOverview,
	admin?: { email?: string; password?: string; first_name?: string; last_name?: string },
): Promise<void> {
	const logger = useLogger();
	const env = useEnv();

	const { nanoid } = await import('nanoid');

	logger.info('Setting up first admin role...');
	const accessService = new AccessService({ schema });
	const policiesService = new PoliciesService({ schema });
	const rolesService = new RolesService({ schema });

	const role = await rolesService.createOne(defaultAdminRole);
	const policy = await policiesService.createOne(defaultAdminPolicy);

	await accessService.createOne({ policy, role });

	logger.info('Adding first admin user...');
	const usersService = new UsersService({ schema });

	let adminEmail = admin?.email ?? env['ADMIN_EMAIL'];

	if (!adminEmail) {
		logger.info('No admin email provided. Defaulting to "admin@example.com"');
		adminEmail = 'admin@example.com';
	}

	let adminPassword = admin?.password ?? env['ADMIN_PASSWORD'];

	if (!adminPassword) {
		adminPassword = nanoid(12);
		logger.info(`No admin password provided. Defaulting to "${adminPassword}"`);
	}

	const token = env['ADMIN_TOKEN'] ?? null;

	await usersService.createOne({
		...defaultAdminUser,
		first_name: admin?.first_name ?? defaultAdminUser.first_name,
		last_name: admin?.last_name ?? defaultAdminUser.last_name,
		email: adminEmail,
		password: adminPassword,
		token,
		role,
	});
}
