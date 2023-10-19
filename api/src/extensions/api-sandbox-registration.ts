import type { OperationHandler } from '@directus/extensions';
import type { ActionHandler, FilterHandler, PromiseCallback } from '@directus/types';
import type { RequestHandler, Router } from 'express';
import express from 'express';
import type { Reference } from 'isolated-vm';
import type { IncomingHttpHeaders } from 'node:http';
import { setTimeout } from 'node:timers/promises';
import emitter from '../emitter.js';
import env from '../env.js';
import { getFlowManager } from '../flows.js';
import logger from '../logger.js';

export function log(message: Reference<string>): void {
	if (message.typeof !== 'string') throw new Error('Log message has to be of type string');

	logger.info(message.copySync());
}

export async function timeout(milliseconds: Reference<number>): Promise<void> {
	if (milliseconds.typeof !== 'number') throw new Error('Timeout message has to be of type number');

	await setTimeout(await milliseconds.copy());
}

export function registerFilterGenerator() {
	const sandboxTimeout = Number(env['EXTENSIONS_SANDBOX_TIMEOUT']);

	const unregisterFunctions: PromiseCallback[] = [];

	const registerFilter = (
		event: Reference<string>,
		cb: Reference<(payload: unknown) => unknown | Promise<unknown>>
	) => {
		if (event.typeof !== 'string') throw new Error('Filter event has to be of type string');
		if (cb.typeof !== 'function') throw new Error('Filter handler has to be of type function');

		const eventCopied = event.copySync();

		const handler: FilterHandler = async (payload) => {
			const response = await cb.apply(null, [payload], {
				arguments: { copy: true },
				result: { reference: true, promise: true },
				timeout: sandboxTimeout,
			});

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
	const sandboxTimeout = Number(env['EXTENSIONS_SANDBOX_TIMEOUT']);

	const unregisterFunctions: PromiseCallback[] = [];

	const registerAction = (event: Reference<string>, cb: Reference<(payload: unknown) => void | Promise<void>>) => {
		if (event.typeof !== 'string') throw new Error('Action event has to be of type string');
		if (cb.typeof !== 'function') throw new Error('Action handler has to be of type function');

		const eventCopied = event.copySync();

		const handler: ActionHandler = (payload) =>
			cb.apply(null, [payload], {
				arguments: { copy: true },
				result: { reference: true, promise: true },
				timeout: sandboxTimeout,
			});

		emitter.onAction(eventCopied, handler);

		unregisterFunctions.push(() => {
			emitter.offAction(eventCopied, handler);
		});
	};

	return { register: registerAction, unregisterFunctions };
}

export function registerRouteGenerator(endpointName: string, endpointRouter: Router) {
	const sandboxTimeout = Number(env['EXTENSIONS_SANDBOX_TIMEOUT']);

	const router = express.Router();

	endpointRouter.use(`/${endpointName}`, router);

	const registerRoute = (
		path: Reference<string>,
		method: Reference<'get' | 'post' | 'put' | 'patch' | 'delete'>,
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

			const response = await cb.apply(null, [request], {
				arguments: { copy: true },
				result: { reference: true, promise: true },
				timeout: sandboxTimeout,
			});

			const responseCopied = await response.copy();

			res.status(responseCopied.status).send(responseCopied.body);
		};

		switch (methodCopied) {
			case 'get':
				router.get(pathCopied, handler);
				break;
			case 'post':
				router.post(pathCopied, handler);
				break;
			case 'put':
				router.put(pathCopied, handler);
				break;
			case 'patch':
				router.patch(pathCopied, handler);
				break;
			case 'delete':
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
	const sandboxTimeout = Number(env['EXTENSIONS_SANDBOX_TIMEOUT']);

	const flowManager = getFlowManager();

	const unregisterFunctions: PromiseCallback[] = [];

	const registerOperation = (
		id: Reference<string>,
		cb: Reference<(data: Record<string, unknown>) => unknown | Promise<unknown> | void>
	) => {
		if (id.typeof !== 'string') throw new Error('Operation config id has to be of type string');
		if (cb.typeof !== 'function') throw new Error('Operation config handler has to be of type function');

		const idCopied = id.copySync();

		const handler: OperationHandler = async (data) =>
			cb.apply(null, [data], {
				arguments: { copy: true },
				result: { reference: true, promise: true },
				timeout: sandboxTimeout,
			});

		flowManager.addOperation(idCopied, handler);

		unregisterFunctions.push(() => {
			flowManager.removeOperation(idCopied);
		});
	};

	return { register: registerOperation, unregisterFunctions };
}
