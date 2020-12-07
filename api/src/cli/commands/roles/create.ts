export default async function rolesCreate({ name, admin }: any) {
	const { default: database, schemaInspector } = require('../../../database/index');
	const { RolesService } = require('../../../services/roles');

	if (!name) {
		console.error('Name is required');
		process.exit(1);
	}

	try {
		const schema = await schemaInspector.overview();
		const service = new RolesService({ schema: schema, knex: database });

		const id = await service.create({ name, admin_access: admin });
		console.log(id);
		database.destroy();
		process.exit(0);
	} catch (err) {
		console.error(err);
		process.exit(1);
	}
}
