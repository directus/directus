import { select } from './select/select.js';
import { from } from './from/from.js';
import type { AbstractQueryFieldNodePrimitive, ParameterizedQuery } from '@directus/data/types';

export class PostgresStatement {
	table: string;
	select: string;
	from: string;

	constructor(table: string) {
		this.table = table;
		this.select = select([], table);
		this.from = from(table);
	}

	addSelect(fields: AbstractQueryFieldNodePrimitive[]) {
		this.select = select(fields, this.table);
	}

	toParameterizedQuery(): ParameterizedQuery {
		return {
			statement: `${this.select} ${this.from}`.replace(/\s+/g, ' ').trimEnd() + ';',
			values: [],
		};
	}
}
