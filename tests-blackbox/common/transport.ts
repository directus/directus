import request from 'supertest';
import { jsonToGraphQLQuery } from 'json-to-graphql-query';

export function processGraphQLJson(jsonQuery: any) {
	return jsonToGraphQLQuery(jsonQuery);
}

export async function requestGraphQL(
	host: string,
	isSystemCollection: boolean,
	token: string | null,
	jsonQuery: any,
	variables?: any
): Promise<any> {
	const req = request(host)
		.post(isSystemCollection ? '/graphql/system' : '/graphql')
		.send({
			query: processGraphQLJson(jsonQuery),
			variables,
		});

	if (token) req.set('Authorization', `Bearer ${token}`);

	return await req;
}
