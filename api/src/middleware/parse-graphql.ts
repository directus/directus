import { RequestHandler } from 'express';
import { MethodNotAllowedException } from '../exceptions';
import asyncHandler from '../utils/async-handler';

export const parseGraphQL: RequestHandler = asyncHandler(async (req, res, next) => {
	if (req.method !== 'GET' && req.method !== 'POST') {
		throw new MethodNotAllowedException('GraphQL only supports GET and POST requests.', { allow: ['GET', 'POST'] });
	}
});
