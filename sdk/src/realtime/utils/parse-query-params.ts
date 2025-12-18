import { queryToParams } from '../../rest/index.js';

function parseItemToQueryParams(query: Record<string, unknown>) {
	return queryToParams(query);
}

export const parseQueryParams = <Input>(query: Input): Input => {
	try {
		return parseItemToQueryParams(query as any) as Input;
	} catch {
		return query;
	}
};
