import { RequestHandler } from 'express';
import { InvalidQueryException, MethodNotAllowedException, InvalidPayloadException } from '../exceptions';
import asyncHandler from '../utils/async-handler';
import { GraphQLParams } from '../types';
import { getOperationAST, Source, parse, DocumentNode } from 'graphql';

export const parseGraphQL: RequestHandler = asyncHandler(async (req, res, next) => {
	if (req.method !== 'GET' && req.method !== 'POST') {
		throw new MethodNotAllowedException('GraphQL only supports GET and POST requests.', { allow: ['GET', 'POST'] });
	}

	let query: string | null = null;
	let variables: Record<string, unknown> | null = null;
	let operationName: string | null = null;
	let document: DocumentNode;

	if (req.method === 'GET') {
		query = (req.query.query as string | undefined) || null;

		if (req.params.variables) {
			try {
				variables = JSON.parse(req.query.variables as string);
			} catch {
				throw new InvalidQueryException(`Variables are invalid JSON.`);
			}
		} else {
			variables = {};
		}

		operationName = (req.query.operationName as string | undefined) || null;
	} else {
		query = req.body.query || null;
		variables = req.body.variables || null;
		operationName = req.body.operationName || null;
	}

	if (query === null) {
		throw new InvalidPayloadException('Must provide query string.');
	}

	try {
		document = parse(new Source(query));
	} catch (err) {
		throw new InvalidPayloadException(`GraphQL schema validation error.`, {
			graphqlErrors: [err],
		});
	}

	// You can only do `query` through GET
	if (req.method === 'GET') {
		const operationAST = getOperationAST(document, operationName);
		if (operationAST?.operation !== 'query') {
			throw new MethodNotAllowedException(`Can only perform a ${operationAST?.operation} from a POST request.`, {
				allow: ['POST'],
			});
		}
	}

	res.locals.graphqlParams = { document, query, variables, operationName, contextValue: { req, res } } as GraphQLParams;

	return next();
});
