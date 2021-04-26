import { getSchema } from '../../../utils/get-schema';

export default async function rolesCreate(role: { name: string; admin: boolean }): Promise<void> {
	const { default: database } = require('../../../database/index');
	const { RolesService } = require('../../../services/roles');

	if (!role.name) {
		console.error('Name is required');
		process.exit(1);
	}

	try {
		const schema = await getSchema();
		const service = new RolesService({ schema: schema, knex: database });

		const id = await service.createOne({ name: role.name, admin_access: role.admin });
		console.log(id);
		database.destroy();
		process.exit(0);
	} catch (err) {
		console.error(err);
		process.exit(1);
	}
}
