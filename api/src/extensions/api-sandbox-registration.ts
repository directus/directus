import type { OperationHandler } from '@directus/extensions';
import type { ActionHandler, FilterHandler, PromiseCallback } from '@directus/types';
import type { RequestHandler, Router } from 'express';
import express from 'express';
import type { Reference } from 'isolated-vm';
import type { IncomingHttpHeaders } from 'node:http';
import emitter from '../emitter.js';
import env from '../env.js';
import { getFlowManager } from '../flows.js';
import logger from '../logger.js';

type Args<T> = T extends (...args: infer Args) => unknown ? Args : any[];
type Result<T> = T extends (...args: any) => infer Result ? Result : unknown;

async function callReference<T extends (...args: any[]) => unknown | Promise<unknown>>(
	fn: Reference<T>,
	args: Args<T>
): Promise<Reference<Result<T>>> {
	const sandboxTimeout = Number(env['EXTENSIONS_SANDBOX_TIMEOUT']);

	try {
		return await fn.apply(undefined, args, {
			arguments: { copy: true },
			result: { reference: true, promise: true },
			timeout: sandboxTimeout,
		});
	} catch (e) {
		if (e instanceof RangeError) {
			logger.error(`Extension sandbox has reached the memory limit`);
			logger.error(e);

			process.abort();
		}

		throw e;
	}
}

export function registerFilterGenerator() {
	const unregisterFunctions: PromiseCallback[] = [];

	const registerFilter = (
		event: Reference<string>,
		cb: Reference<(payload: unknown) => unknown | Promise<unknown>>
	) => {
		if (event.typeof !== 'string') throw new Error('Filter event has to be of type string');
		if (cb.typeof !== 'function') throw new Error('Filter handler has to be of type function');

		const eventCopied = event.copySync();

		const handler: FilterHandler = async (payload) => {
			const response = await callReference(cb, [payload]);

			return response.copy();
		};

		emitter.onFilter(eventCopied, handler);

		unregisterFunctions.push(() => {
			emitter.offFilter(eventCopied, handler);
		});
	};

	return { register: registerFilter, unregisterFunctions };
}

export function registerActionGenerator() {
	const unregisterFunctions: PromiseCallback[] = [];

	const registerAction = (event: Reference<string>, cb: Reference<(payload: unknown) => void | Promise<void>>) => {
		if (event.typeof !== 'string') throw new Error('Action event has to be of type string');
		if (cb.typeof !== 'function') throw new Error('Action handler has to be of type function');

		const eventCopied = event.copySync();

		const handler: ActionHandler = (payload) => callReference(cb, [payload]);

		emitter.onAction(eventCopied, handler);

		unregisterFunctions.push(() => {
			emitter.offAction(eventCopied, handler);
		});
	};

	return { register: registerAction, unregisterFunctions };
}

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
		>
	) => {
		if (path.typeof !== 'string') throw new Error('Route path has to be of type string');
		if (method.typeof !== 'string') throw new Error('Route method has to be of type string');
		if (cb.typeof !== 'function') throw new Error('Route handler has to be of type function');

		const pathCopied = path.copySync();
		const methodCopied = method.copySync();

		const handler: RequestHandler = async (req, res) => {
			const request = { url: req.url, headers: req.headers, body: req.body };

			const response = await callReference(cb, [request]);

			const responseCopied = await response.copy();

			res.status(responseCopied.status).send(responseCopied.body);
		};

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

export function registerOperationGenerator() {
	const flowManager = getFlowManager();

	const unregisterFunctions: PromiseCallback[] = [];

	const registerOperation = (
		id: Reference<string>,
		cb: Reference<(data: Record<string, unknown>) => unknown | Promise<unknown> | void>
	) => {
		if (id.typeof !== 'string') throw new Error('Operation config id has to be of type string');
		if (cb.typeof !== 'function') throw new Error('Operation config handler has to be of type function');

		const idCopied = id.copySync();

		const handler: OperationHandler = async (data) => callReference(cb, [data]);

		flowManager.addOperation(idCopied, handler);

		unregisterFunctions.push(() => {
			flowManager.removeOperation(idCopied);
		});
	};

	return { register: registerOperation, unregisterFunctions };
}
