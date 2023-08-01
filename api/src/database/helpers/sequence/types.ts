import type { Knex } from 'knex';
import { DatabaseHelper } from '../types.js';

export class AutoSequenceHelper extends DatabaseHelper {
	resetAutoIncrementSequence(_table: string, _column: string): Knex.Raw | null {
		return null;
	}
}
