import type { AbstractQuery } from '@directus/data/types';

export interface SqlStatementSelectPrimitive {
	type: 'primitive';
	table: string;
	column: string;
	as?: string;
}

// export interface SqlStatementSelectFn {
// 	type: 'fn';
// 	fn: string;
// 	args: (string | number | boolean)[];
// 	table: string;
// 	column: string;
// 	as?: string;
// }

// export interface SqlStatementSelectJson {
// 	type: 'json';
// 	table: string;
// 	column: string;
// 	as?: string;
// 	path: string;
// }

export interface SqlStatement {
	select: SqlStatementSelectPrimitive[];
	from: string;

	// limit: {
	// 	parameterIndex: number;
	// };

	// parameters: (string | boolean | number)[];
}

export const convertAbstractQueryToSqlStatement = (abstractQuery: AbstractQuery): SqlStatement => {
	const statement: SqlStatement = {
		select: abstractQuery.nodes.map((abstractNode) => {
			switch (abstractNode.type) {
				case 'primitive': {
					const statement: SqlStatementSelectPrimitive = {
						type: 'primitive',
						table: abstractQuery.collection,
						column: abstractNode.field,
					};

					if (abstractNode.alias) {
						statement.as = abstractNode.alias;
					}

					return statement;
				}

				case 'fn':
				case 'm2o':
				case 'o2m':
				case 'a2o':
				case 'o2a':
				default:
					throw new Error(`Type ${abstractNode.type} hasn't been implemented yet`);
			}
		}),
		from: abstractQuery.collection,
	};

	return statement;
};
