import { CapabilitiesHelperDefault } from './default.js';

export class CapabilitiesHelperOracle extends CapabilitiesHelperDefault {
	override async preservesInsertOrderInReturning(): Promise<boolean> {
		// knex's oracledb compiler emits one `INSERT … RETURNING … INTO :bind` per row inside
		// a single BEGIN…END; block and collects per-row PKs via positional OUT binds, so the
		// returned array follows JS-array order by construction.
		// https://github.com/knex/knex/blob/3.2.10/lib/dialects/oracledb/query/oracledb-querycompiler.js
		return true;
	}
}
