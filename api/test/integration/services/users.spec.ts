import { getAllDbs, getKnexForDb } from '../util/knexInstanceProvider';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import Knex from 'knex';
import { UsersService } from '../../../src/services';

describe('UsersService', () => {
	getAllDbs().forEach((db) => {
		describe(db, () => {
			let knex: Knex;
			let users: UsersService;
			before(() => {
				knex = getKnexForDb(db);
				users = new UsersService({
					knex,
					schema: {},
				});
			});

			after(() => {
				return knex.destroy();
			});

			describe('create', () => {
				it('creates new user successfully', async () => {
					await users.create([{}]);
				});
			});
		});
	});
});
