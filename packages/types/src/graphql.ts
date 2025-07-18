import type { Request, Response } from 'express';
import type { DocumentNode } from 'graphql';

export type GQLScope = 'items' | 'system';

export interface GraphQLParams {
	query: string | null;
	variables: { readonly [name: string]: unknown } | null;
	operationName: string | null;
	document: DocumentNode;
	contextValue: {
		req?: Request;
		res?: Response;
	};
}
