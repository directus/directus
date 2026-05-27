import getDatabase from '../../../database/index.js';
import { useLogger } from '../../../logger/index.js';
import { PoliciesService } from '../../../services/index.js';
import { AccessService } from '../../../services/index.js';
import { RolesService } from '../../../services/roles.js';
import { getSchema } from '../../../utils/get-schema.js';

export default async function rolesCreate({
	role: name,
	admin,
	app,
}: {
	role: string;
	admin: boolean;
	app: boolean;
}): Promise<void> {
	const database = getDatabase();
	const logger = useLogger();

	if (!name) {
		logger.error('Name is required');
		process.exit(1);
	}

	try {
		const schema = await getSchema();
		const rolesService = new RolesService({ schema: schema, knex: database });
		const policiesService = new PoliciesService({ schema: schema, knex: database });
		const accessService = new AccessService({ schema: schema, knex: database });

		const adminPolicyId = await policiesService.createOne({
			name: `Policy for ${name}`,
			admin_access: admin,
			app_access: app,
			icon: 'supervised_user_circle',
		});

		const roleId = await rolesService.createOne({ name });

		await accessService.createOne({
			role: roleId,
			policy: adminPolicyId,
		});

		process.stdout.write(`${String(roleId)}\n`);
		database.destroy();
		process.exit(0);
	} catch (err: any) {
		logger.error(err);
		process.exit(1);
	}
}
