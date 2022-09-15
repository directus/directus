import { getSchema } from '../../../utils/get-schema.js';
import { RolesService } from '../../../services/index.js';
import getDatabase from '../../../database/index.js';
import logger from '../../../logger.js';

export default async function rolesCreate({ role: name, admin }: { role: string; admin: boolean }): Promise<void> {
	const database = getDatabase();

	if (!name) {
		logger.error('Name is required');
		process.exit(1);
	}

	try {
		const schema = await getSchema();
		const service = new RolesService({ schema: schema, knex: database });

		const id = await service.createOne({ name, admin_access: admin });
		process.stdout.write(`${String(id)}\n`);
		database.destroy();
		process.exit(0);
	} catch (err: any) {
		logger.error(err);
		process.exit(1);
	}
}
