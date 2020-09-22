import listFolders from '../utils/list-folders';
import path from 'path';
import env from '../env';
import { ServiceUnavailableException } from '../exceptions';
import { Router } from 'express';
import emitter from '../emitter';
import logger from '../logger';
import { HookRegisterFunction } from '../types';

export class ExtensionsService {
	registeredHooks: Record<string, Function> = {};

	async listExtensions(type: string) {
		const extensionsPath = env.EXTENSIONS_PATH as string;
		const location = path.join(extensionsPath, type);

		try {
			return await listFolders(location);
		} catch (err) {
			if (err.code === 'ENOENT') {
				throw new ServiceUnavailableException(`Extension folder "extensions/${type}" couldn't be opened`, {
					service: 'extensions',
				});
			}
			throw err;
		}
	}

	async register(router: Router) {
		let hooks: string[] = [];
		let endpoints: string[] = [];

		try {
			hooks = await this.listExtensions('hooks');
			this.registerHooks(hooks);
		} catch (err) {
			logger.warn(err);
		}

		try {
			endpoints = await this.listExtensions('endpoints');
		} catch (err) {
			logger.warn(err);
		}

		console.log(hooks, endpoints);
	}

	registerHooks(hooks: string[]) {
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
			const events = register(null);

			for (const [event, handler] of Object.entries(events)) {
				emitter.on(event, handler);
			}
		}
	}
}
