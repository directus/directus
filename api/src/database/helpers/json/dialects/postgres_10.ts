import { Knex } from 'knex';
import { JsonHelperDefault } from './default';
import { JsonFieldNode } from '../../../../types';
import { Item } from '@directus/shared/types';

// To be implemented using fallback for now
export class JsonHelperPostgres_10 extends JsonHelperDefault {
	preProcess(dbQuery: Knex.QueryBuilder, table: string): void {
		// not implemented
	}
	postProcess(_items: Item[]): void {
		// not implemented
	}
	filterQuery(collection: string, node: JsonFieldNode): Knex.Raw | null {
		return null;
	}
}
