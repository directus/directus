import { callReference } from './call-reference.js';
import asyncHandler from '../../../../utils/async-handler.js';
import type { RequestHandler, Router } from 'express';
import express from 'express';
import type { Reference } from 'isolated-vm';
import type { IncomingHttpHeaders } from 'node:http';

export function registerRouteGenerator(endpointName: string, endpointRouter: Router) {
	const router = express.Router();

	endpointRouter.use(`/${endpointName}`, router);

	const registerRoute = (
		path: Reference<string>,
		method: Reference<'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'>,
		cb: Reference<
			(req: {
				url: string;
				headers: IncomingHttpHeaders;
				body: string;
			}) => { status: number; body: string } | Promise<{ status: number; body: string }>
		>,
	) => {
		if (path.typeof !== 'string') throw new TypeError('Route path has to be of type string');
		if (method.typeof !== 'string') throw new TypeError('Route method has to be of type string');
		if (cb.typeof !== 'function') throw new TypeError('Route handler has to be of type function');

		const pathCopied = path.copySync();
		const methodCopied = method.copySync();

		const handler: RequestHandler = asyncHandler(async (req, res) => {
			const request = { url: req.url, headers: req.headers, body: req.body };

			const response = await callReference(cb, [request]);

			const responseCopied = await response.copy();

			res.status(responseCopied.status).send(responseCopied.body);
		});

		switch (methodCopied) {
			case 'GET':
				router.get(pathCopied, handler);
				break;
			case 'POST':
				router.post(pathCopied, handler);
				break;
			case 'PUT':
				router.put(pathCopied, handler);
				break;
			case 'PATCH':
				router.patch(pathCopied, handler);
				break;
			case 'DELETE':
				router.delete(pathCopied, handler);
				break;
		}
	};

	const unregisterFunction = () => {
		endpointRouter.stack = endpointRouter.stack.filter((layer) => router !== layer.handle);
	};

	return { register: registerRoute, unregisterFunction };
}
