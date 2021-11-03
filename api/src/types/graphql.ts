import { Request, Response } from 'express';
import { DocumentNode } from 'graphql';
import { ObjectTypeComposerArgumentConfigMap, ObjectTypeComposerFieldConfigMapDefinition } from 'graphql-compose';

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

export interface CustomGraphQLMutation {
	operationName: string;
	variables: ObjectTypeComposerArgumentConfigMap<any>;
	fields: ObjectTypeComposerFieldConfigMapDefinition<any, any>;
	resolver: (_: any, payload?: { readonly [name: string]: unknown }) => { readonly [name: string]: unknown };
}

export interface CustomGraphQLQuery {
	operationName: string;
	variables: ObjectTypeComposerArgumentConfigMap<any>;
	fields: ObjectTypeComposerFieldConfigMapDefinition<any, any>;
	resolver: (_: any, payload?: { readonly [name: string]: unknown }) => { readonly [name: string]: unknown };
}
