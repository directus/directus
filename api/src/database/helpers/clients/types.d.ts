declare module 'knex/lib/dialects/oracledb/index.js' {
	import type { Knex } from 'knex';

	declare class Client_Oracledb extends Knex.Client {}

	export default Client_Oracledb;
}
