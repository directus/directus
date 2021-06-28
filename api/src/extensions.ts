import express, { Router } from 'express';
import path from 'path';
import { AppExtensionType, Extension, ExtensionType } from '@directus/shared/types';
import {
	ensureExtensionDirs,
	generateExtensionsEntry,
	getLocalExtensions,
	getPackageExtensions,
	resolvePackage,
} from '@directus/shared/utils';
import { APP_EXTENSION_TYPES, SHARED_DEPS } from '@directus/shared/constants';
import getDatabase from './database';
import emitter from './emitter';
import env from './env';
import * as exceptions from './exceptions';
import logger from './logger';
import { HookRegisterFunction, EndpointRegisterFunction } from './types';
import fse from 'fs-extra';
import { getSchema } from './utils/get-schema';

import * as services from './services';
import { schedule, validate } from 'node-cron';
import { rollup } from 'rollup';
// @TODO Remove this once a new version of @rollup/plugin-virtual has been released
// @ts-expect-error
import virtual from '@rollup/plugin-virtual';
import alias from '@rollup/plugin-alias';

let extensions: Extension[] = [];
let extensionBundles: Partial<Record<AppExtensionType, string>> = {};

export async function initializeExtensions(): Promise<void> {
	await ensureExtensionDirs(env.EXTENSIONS_PATH);
	extensions = await getExtensions();

	if (!('DIRECTUS_DEV' in process.env)) {
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
	const packageExtensions = await getPackageExtensions('.');
	const localExtensions = await getLocalExtensions(env.EXTENSIONS_PATH);

	return [...packageExtensions, ...localExtensions];
}

async function generateExtensionBundles() {
	const sharedDepsMapping = await getSharedDepsMapping(SHARED_DEPS);
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
	const adminUrl = env.PUBLIC_URL.endsWith('/') ? env.PUBLIC_URL + 'admin' : env.PUBLIC_URL + '/admin';

	const depsMapping: Record<string, string> = {};
	for (const dep of deps) {
		const depName = appDir.find((file) => dep.replace(/\//g, '_') === file.substring(0, file.indexOf('.')));

		if (depName) {
			depsMapping[dep] = `${adminUrl}/${depName}`;
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
		} catch (error) {
			logger.warn(`Couldn't register hook "${hook.name}"`);
			logger.warn(error);
		}
	}

	function registerHook(hook: Extension) {
		const hookPath = path.resolve(hook.path, hook.entrypoint || '');
		const hookInstance: HookRegisterFunction | { default?: HookRegisterFunction } = require(hookPath);

		let register: HookRegisterFunction = hookInstance as HookRegisterFunction;
		if (typeof hookInstance !== 'function') {
			if (hookInstance.default) {
				register = hookInstance.default;
			}
		}

		const events = register({ services, exceptions, env, database: getDatabase(), getSchema });

		for (const [event, handler] of Object.entries(events)) {
			if (event.startsWith('cron(')) {
				const cron = event.match(/\(([^)]+)\)/)?.[1];

				if (!cron || validate(cron) === false) {
					logger.warn(`Couldn't register cron hook. Provided cron is invalid: ${cron}`);
				} else {
					schedule(cron, handler);
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
		} catch (error) {
			logger.warn(`Couldn't register endpoint "${endpoint.name}"`);
			logger.warn(error);
		}
	}

	function registerEndpoint(endpoint: Extension) {
		const endpointPath = path.resolve(endpoint.path, endpoint.entrypoint || '');
		const endpointInstance: EndpointRegisterFunction | { default?: EndpointRegisterFunction } = require(endpointPath);

		let register: EndpointRegisterFunction = endpointInstance as EndpointRegisterFunction;
		if (typeof endpointInstance !== 'function') {
			if (endpointInstance.default) {
				register = endpointInstance.default;
			}
		}

		const scopedRouter = express.Router();
		router.use(`/${endpoint.name}/`, scopedRouter);

		register(scopedRouter, { services, exceptions, env, database: getDatabase(), getSchema });
	}
}
