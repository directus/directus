import { DatabaseHelper } from '../types.js';
import type { Knex } from 'knex';

export class AutoSequenceHelper extends DatabaseHelper {
	async resetAutoIncrementSequence(_table: string, _column: string): Promise<Knex.Raw | void> {
		return;
	}
}
