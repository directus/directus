import express, { Router } from 'express';
import path from 'path';
import { AppExtensionType, Extension, ExtensionType } from '@directus/shared/types';
import {
	ensureExtensionDirs,
	generateExtensionsEntry,
	getLocalExtensions,
	getPackageExtensions,
	resolvePackage,
} from '@directus/shared/utils/node';
import {
	API_EXTENSION_PACKAGE_TYPES,
	API_EXTENSION_TYPES,
	APP_EXTENSION_TYPES,
	APP_SHARED_DEPS,
	EXTENSION_PACKAGE_TYPES,
	EXTENSION_TYPES,
} from '@directus/shared/constants';
import getDatabase from './database';
import emitter from './emitter';
import env from './env';
import * as exceptions from './exceptions';
import logger from './logger';
import { HookConfig, EndpointConfig } from './types';
import fse from 'fs-extra';
import { getSchema } from './utils/get-schema';

import * as services from './services';
import { schedule, validate } from 'node-cron';
import { REGEX_BETWEEN_PARENS } from '@directus/shared/constants';
import { rollup } from 'rollup';
// @TODO Remove this once a new version of @rollup/plugin-virtual has been released
// @ts-expect-error
import virtual from '@rollup/plugin-virtual';
import alias from '@rollup/plugin-alias';
import { Url } from './utils/url';
import getModuleDefault from './utils/get-module-default';

let extensions: Extension[] = [];
let extensionBundles: Partial<Record<AppExtensionType, string>> = {};
const registeredHooks: string[] = [];

export async function initializeExtensions(): Promise<void> {
	try {
		await ensureExtensionDirs(env.EXTENSIONS_PATH, env.SERVE_APP ? EXTENSION_TYPES : API_EXTENSION_TYPES);
		extensions = await getExtensions();
	} catch (err: any) {
		logger.warn(`Couldn't load extensions`);
		logger.warn(err);
	}

	if (env.SERVE_APP) {
		extensionBundles = await generateExtensionBundles();
	}

	const loadedExtensions = listExtensions();
	if (loadedExtensions.length > 0) {
		logger.info(`Loaded extensions: ${loadedExtensions.join(', ')}`);
	}
}

export function listExtensions(type?: ExtensionType): string[] {
	if (type === undefined) {
		return extensions.map((extension) => extension.name);
	} else {
		return extensions.filter((extension) => extension.type === type).map((extension) => extension.name);
	}
}

export function getAppExtensionSource(type: AppExtensionType): string | undefined {
	return extensionBundles[type];
}

export function registerExtensionEndpoints(router: Router): void {
	const endpoints = extensions.filter((extension) => extension.type === 'endpoint');
	registerEndpoints(endpoints, router);
}

export function registerExtensionHooks(): void {
	const hooks = extensions.filter((extension) => extension.type === 'hook');
	registerHooks(hooks);
}

async function getExtensions(): Promise<Extension[]> {
	const packageExtensions = await getPackageExtensions(
		'.',
		env.SERVE_APP ? EXTENSION_PACKAGE_TYPES : API_EXTENSION_PACKAGE_TYPES
	);
	const localExtensions = await getLocalExtensions(
		env.EXTENSIONS_PATH,
		env.SERVE_APP ? EXTENSION_TYPES : API_EXTENSION_TYPES
	);

	return [...packageExtensions, ...localExtensions];
}

async function generateExtensionBundles() {
	const sharedDepsMapping = await getSharedDepsMapping(APP_SHARED_DEPS);
	const internalImports = Object.entries(sharedDepsMapping).map(([name, path]) => ({
		find: name,
		replacement: path,
	}));

	const bundles: Partial<Record<AppExtensionType, string>> = {};

	for (const extensionType of APP_EXTENSION_TYPES) {
		const entry = generateExtensionsEntry(extensionType, extensions);

		const bundle = await rollup({
			input: 'entry',
			external: Object.values(sharedDepsMapping),
			makeAbsoluteExternalsRelative: false,
			plugins: [virtual({ entry }), alias({ entries: internalImports })],
		});
		const { output } = await bundle.generate({ format: 'es', compact: true });

		bundles[extensionType] = output[0].code;

		await bundle.close();
	}

	return bundles;
}

async function getSharedDepsMapping(deps: string[]) {
	const appDir = await fse.readdir(path.join(resolvePackage('@directus/app'), 'dist'));

	const depsMapping: Record<string, string> = {};
	for (const dep of deps) {
		const depName = appDir.find((file) => dep.replace(/\//g, '_') === file.substring(0, file.indexOf('.')));

		if (depName) {
			const depUrl = new Url(env.PUBLIC_URL).addPath('admin', depName);

			depsMapping[dep] = depUrl.toString({ rootRelative: true });
		} else {
			logger.warn(`Couldn't find shared extension dependency "${dep}"`);
		}
	}

	return depsMapping;
}

function registerHooks(hooks: Extension[]) {
	for (const hook of hooks) {
		try {
			registerHook(hook);
		} catch (error: any) {
			logger.warn(`Couldn't register hook "${hook.name}"`);
			logger.warn(error);
		}
	}

	function registerHook(hook: Extension) {
		const hookPath = path.resolve(hook.path, hook.entrypoint || '');
		const hookInstance: HookConfig | { default: HookConfig } = require(hookPath);

		// Make sure hooks are only registered once
		if (registeredHooks.includes(hookPath)) {
			return;
		} else {
			registeredHooks.push(hookPath);
		}

		const register = getModuleDefault(hookInstance);

		const events = register({ services, exceptions, env, database: getDatabase(), logger, getSchema });

		for (const [event, handler] of Object.entries(events)) {
			if (event.startsWith('cron(')) {
				const cron = event.match(REGEX_BETWEEN_PARENS)?.[1];

				if (!cron || validate(cron) === false) {
					logger.warn(`Couldn't register cron hook. Provided cron is invalid: ${cron}`);
				} else {
					schedule(cron, async () => {
						try {
							await handler();
						} catch (error: any) {
							logger.error(error);
						}
					});
				}
			} else {
				emitter.on(event, handler);
			}
		}
	}
}

function registerEndpoints(endpoints: Extension[], router: Router) {
	for (const endpoint of endpoints) {
		try {
			registerEndpoint(endpoint);
		} catch (error: any) {
			logger.warn(`Couldn't register endpoint "${endpoint.name}"`);
			logger.warn(error);
		}
	}

	function registerEndpoint(endpoint: Extension) {
		const endpointPath = path.resolve(endpoint.path, endpoint.entrypoint || '');
		const endpointInstance: EndpointConfig | { default: EndpointConfig } = require(endpointPath);

		const mod = getModuleDefault(endpointInstance);

		const register = typeof mod === 'function' ? mod : mod.handler;
		const pathName = typeof mod === 'function' ? endpoint.name : mod.id;

		const scopedRouter = express.Router();
		router.use(`/${pathName}`, scopedRouter);

		register(scopedRouter, { services, exceptions, env, database: getDatabase(), logger, getSchema });
	}
}
