export default async function usersCreate({ email, password, role }: any) {
	const { default: database, schemaInspector } = require('../../../database/index');
	const { UsersService } = require('../../../services/users');

	if (!email || !password || !role) {
		console.error('Email, password, role are required');
		process.exit(1);
	}

	try {
		const schema = await schemaInspector.overview();
		const service = new UsersService({ schema, knex: database });

		const id = await service.create({ email, password, role, status: 'active' });
		console.log(id);
	} catch (err) {
		console.error(err);
	} finally {
		database.destroy();
	}
}
