export default async function usersCreate({ email, password, role }: any) {
	const database = require('../../../database/index').default;
	const { UsersService } = require('../../../services/users');

	if (!email || !password || !role) {
		console.error('Email, password, role are required');
		process.exit(1);
	}

	const service = new UsersService();
	const id = await service.create({ email, password, role, status: 'active' });
	console.log(id);
	database.destroy();
}
