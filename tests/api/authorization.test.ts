import config from '../config';
import { getDBsToTest } from '../get-dbs-to-test';
import knex, { Knex } from 'knex';
import { login } from '../setup/utils/authorization';

describe('authorization', () => {
	const databases = new Map<string, Knex>();

	beforeAll(() => {
		const vendors = getDBsToTest();

		for (const vendor of vendors) {
			databases.set(vendor, knex(config.knexConfig[vendor]!));
		}
	});

	afterAll(() => {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		for (const [_vendor, connection] of databases) {
			connection.destroy();
		}
	});
	describe('/login', () => {
		it.each(getDBsToTest())('%p' + ' logins into API successsfully', async (vendor) => {
			expect(Object.keys(await login(config.ports[vendor]!, 'admin@example.com', 'password'))).toStrictEqual([
				'access_token',
				'expires',
				'refresh_token',
			]);
		});
		it.each(getDBsToTest())('%p' + ' API returns an error when login fails', async (vendor) => {
			expect(login(config.ports[vendor]!, 'bad@example.com', 'password')).rejects.toThrow();
		});
	});
});
