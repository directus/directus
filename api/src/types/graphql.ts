import { DocumentNode } from 'graphql';

export interface GraphQLParams {
	query: string | null;
	variables: { readonly [name: string]: unknown } | null;
	operationName: string | null;
	document: DocumentNode;
}
