import { select } from './select/select.js';
import { from } from './from/from.js';
import type { AbstractQueryFieldNodePrimitive } from '@directus/data/types';

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

	toString() {
		if (!this.select || !this.from) {
			throw new Error("The statement doesn't fit the minimum requirements.");
		}

		return `${this.select} ${this.from}`.replace(/\s+/g, ' ').trimEnd() + ';';
	}
}
