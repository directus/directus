import listFolders from './utils/list-folders';
import path from 'path';
import env from './env';
import { ServiceUnavailableException } from './exceptions';
import express, { Router } from 'express';
import emitter from './emitter';
import logger from './logger';
import { HookRegisterFunction, EndpointRegisterFunction } from './types';

import * as exceptions from './exceptions';
import * as services from './services';
import database from './database';

export async function listExtensions(type: string) {
	const extensionsPath = env.EXTENSIONS_PATH as string;
	const location = path.join(extensionsPath, type);

	try {
		return await listFolders(location);
	} catch (err) {
		if (err.code === 'ENOENT') {
			throw new ServiceUnavailableException(
				`Extension folder "extensions/${type}" couldn't be opened`,
				{
					service: 'extensions',
				}
			);
		}
		throw err;
	}
}

export async function registerExtensions(router: Router) {
	let hooks: string[] = [];
	let endpoints: string[] = [];

	try {
		hooks = await listExtensions('hooks');
		registerHooks(hooks);
	} catch (err) {
		logger.warn(err);
	}

	try {
		endpoints = await listExtensions('endpoints');
		registerEndpoints(endpoints, router);
	} catch (err) {
		logger.warn(err);
	}

	console.log(hooks, endpoints);
}

function registerHooks(hooks: string[]) {
	const extensionsPath = env.EXTENSIONS_PATH as string;

	for (const hook of hooks) {
		try {
			registerHook(hook);
		} catch (error) {
			logger.warn(`Couldn't register hook "${hook}"`);
			logger.info(error);
		}
	}

	function registerHook(hook: string) {
		const hookPath = path.resolve(extensionsPath, 'hooks', hook, 'index.js');
		const register: HookRegisterFunction = require(hookPath);
		const events = register({ services, exceptions, env, database });

		for (const [event, handler] of Object.entries(events)) {
			emitter.on(event, handler);
		}
	}
}

function registerEndpoints(endpoints: string[], router: Router) {
	const extensionsPath = env.EXTENSIONS_PATH as string;

	for (const endpoint of endpoints) {
		try {
			registerEndpoint(endpoint);
		} catch (error) {
			logger.warn(`Couldn't register endpoint "${endpoint}"`);
			logger.info(error);
		}
	}

	function registerEndpoint(endpoint: string) {
		const endpointPath = path.resolve(extensionsPath, 'endpoints', endpoint, 'index.js');
		const register: EndpointRegisterFunction = require(endpointPath);

		const scopedRouter = express.Router();
		router.use(`/${endpoint}/`, scopedRouter);

		register(scopedRouter, { services, exceptions, env, database });
	}
}
