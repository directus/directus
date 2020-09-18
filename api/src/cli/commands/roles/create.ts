export default async function rolesCreate({ name, admin }: any) {
	const database = require('../../../database/index').default;
	const RolesService = require('../../../services/roles').default;

	if (!name) {
		console.error('Name is required');
		process.exit(1);
	}

	const service = new RolesService();
	const id = await service.create({ name, admin_access: admin });
	console.log(id);
	database.destroy();
}
