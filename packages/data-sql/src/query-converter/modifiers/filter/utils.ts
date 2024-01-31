import type { AbstractSqlClauses, AbstractSqlQuery } from '../../../types/index.js';

export type FilterResult = {
	clauses: Required<Pick<AbstractSqlClauses, 'where' | 'joins'>>;
	parameters: AbstractSqlQuery['parameters'];
};
