import { getSchema } from '../../../utils/get-schema';
import { RolesService } from '../../../services';
import getDatabase from '../../../database';

export default async function rolesCreate({ role: name, admin }: { role: string; admin: boolean }): Promise<void> {
	const database = getDatabase();

	if (!name) {
		console.error('Name is required');
		process.exit(1);
	}

	try {
		const schema = await getSchema();
		const service = new RolesService({ schema: schema, knex: database });

		const id = await service.createOne({ name, admin_access: admin });
		console.log(id);
		database.destroy();
		process.exit(0);
	} catch (err) {
		console.error(err);
		process.exit(1);
	}
}
