import { Knex } from 'knex';
import { JsonHelperDefault } from './default';
import { JsonFieldNode } from '../../../../types';
import { Item } from '@directus/shared/types';

// To be implemented using fallback for now
export class JsonHelperPostgres_10 extends JsonHelperDefault {
	preProcess(_dbQuery: Knex.QueryBuilder, _table: string): void {
		// not implemented
	}
	postProcess(_items: Item[]): void {
		// not implemented
	}
	filterQuery(_collection: string, _node: JsonFieldNode): Knex.Raw | null {
		return null;
	}
}
