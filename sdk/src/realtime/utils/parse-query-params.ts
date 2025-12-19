import { queryToParams } from '../../utils/query-to-params.js';

export function parseQueryParams<Input>(query: Input): Input {
	try {
		return queryToParams(query as Record<string, unknown>) as Input;
	} catch {
		return query;
	}
}
