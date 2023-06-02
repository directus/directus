import type { AbstractQuery } from '@directus/data/types';

export interface SqlStatement {
	select: string[];
	from: string;
}

export const convert = (abstractQuery: AbstractQuery): SqlStatement => {
	const statement = {};

	// do stuff;

	return statement as SqlStatement;
};
