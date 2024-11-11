import Knex_Client_Oracledb from 'knex/lib/dialects/oracledb/index.js';
import type { Knex } from 'knex';

export class Client_Oracledb extends Knex_Client_Oracledb implements Knex.Client {
	override prepBindings(bindings: any): any {
		const preppedBindings = super.prepBindings(bindings);
		// Create an object with keys 1, 2, 3, ... and the bindings as values
		// This will use the "named" binding syntax in the oracledb driver instead of the positional binding
		return Object.fromEntries(preppedBindings.map((binding: any, index: number) => [index + 1, binding]));
	}
}
