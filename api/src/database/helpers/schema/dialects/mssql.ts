import { Knex } from 'knex';
import { SchemaHelper } from '../types';

export class SchemaHelperMSSQL extends SchemaHelper {
	applyOffset(rootQuery: Knex.QueryBuilder, offset: number): void {
		rootQuery.offset(offset);
		rootQuery.orderBy(1);
	}

	formatUUID(uuid: string): string {
		return uuid.toUpperCase();
	}
}
