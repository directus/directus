import { Item } from '@directus/shared/types';
import { Knex } from 'knex';
import { JsonFieldNode } from '../../../../types';
import { JsonHelperDefault } from './default';

// MS SQL 16+ has better json support
// To be implemented
export class JsonHelperMSSQL_16 extends JsonHelperDefault {
	preProcess(dbQuery: Knex.QueryBuilder, table: string): void {
		// not implemented
	}
	postProcess(items: Item[]): void {
		// not implemented
	}
	filterQuery(collection: string, node: JsonFieldNode): Knex.Raw | null {
		// not implemented
		return null;
	}
}
