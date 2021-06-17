import express, { Router } from 'express';
import path from 'path';
import getDatabase from './database';
import emitter from './emitter';
import env from './env';
import * as exceptions from './exceptions';
import { ServiceUnavailableException } from './exceptions';
import logger from './logger';
import {
	Extension,
	ExtensionType,
	ExtensionDir,
	HookRegisterFunction,
	EndpointRegisterFunction,
	AppExtensionType,
} from './types';
import fse from 'fs-extra';
import { getSchema } from './utils/get-schema';
import { APP_EXTENSION_TYPES, EXTENSION_NAME_REGEX, EXTENSION_TYPES, SHARED_DEPS } from './constants';

import * as services from './services';
import listFolders from './utils/list-folders';
import { schedule, validate } from 'node-cron';
import { resolvePackage } from './utils/resolve-package';
import { rollup } from 'rollup';
// @TODO Remove this once a new version of @rollup/plugin-virtual has been released
// @ts-expect-error
import virtual from '@rollup/plugin-virtual';
import alias from '@rollup/plugin-alias';

let extensions: Extension[] = [];
let extensionBundles: Partial<Record<AppExtensionType, string>> = {};

export async function initializeExtensions(): Promise<void> {
	await ensureDirsExist();
	extensions = await getExtensions();
	extensionBundles = await generateExtensionBundles();

	logger.info(`Loaded extensions: ${listExtensions().join(', ')}`);
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

export function extensionDirToType<T extends ExtensionType>(dir: ExtensionDir<T>): T {
	return dir.slice(0, -1) as T;
}

export function extensionTypeToDir<T extends ExtensionType>(type: T): ExtensionDir<T> {
	return `${type}s`;
}

async function getExtensions(): Promise<Extension[]> {
	return [...(await getPackageExtensions()), ...(await getLocalExtensions())];
}

async function generateExtensionBundles() {
	const sharedDepsMapping = await getSharedDepsMapping(SHARED_DEPS);
	const internalImports = Object.entries(sharedDepsMapping).map(([name, path]) => ({
		find: name,
		replacement: path,
	}));

	const bundles: Partial<Record<AppExtensionType, string>> = {};

	for (const extensionType of APP_EXTENSION_TYPES) {
		const entry = generateExtensionsEntry(extensionType);

		const bundle = await rollup({
			input: 'entry',
			external: Object.values(sharedDepsMapping),
			plugins: [virtual({ entry }), alias({ entries: internalImports })],
		});
		const { output } = await bundle.generate({ format: 'es' });

		bundles[extensionType] = output[0].code.replace(/\n/g, '');

		await bundle.close();
	}

	return bundles;
}

async function getPackageExtensions() {
	const pkg = await fse.readJSON(path.resolve('./package.json'));
	const extensionNames = Object.keys(pkg.dependencies).filter((dep) => EXTENSION_NAME_REGEX.test(dep));

	return listExtensionsChildren(extensionNames);

	async function listExtensionsChildren(extensionNames: string[], root?: string) {
		const extensions: Extension[] = [];

		for (const extensionName of extensionNames) {
			const extensionPath = resolvePackage(extensionName, root);
			const extensionPkg = await fse.readJSON(path.join(extensionPath, 'package.json'));

			if (extensionPkg['directus:extension'].type === 'pack') {
				const extensionChildren = Object.keys(extensionPkg.dependencies).filter((dep) =>
					EXTENSION_NAME_REGEX.test(dep)
				);

				const extension: Extension = {
					path: extensionPath,
					name: extensionName,
					version: extensionPkg.version,
					type: extensionPkg['directus:extension'].type,
					host: extensionPkg['directus:extension'].host,
					children: extensionChildren,
					local: false,
					root: root === undefined,
				};

				extensions.push(extension);
				extensions.push(...(await listExtensionsChildren(extension.children || [], extension.path)));
			} else {
				extensions.push({
					path: extensionPath,
					name: extensionName,
					version: extensionPkg.version,
					type: extensionPkg['directus:extension'].type,
					entrypoint: extensionPkg['directus:extension'].path,
					host: extensionPkg['directus:extension'].host,
					local: false,
					root: root === undefined,
				});
			}
		}

		return extensions;
	}
}

async function getLocalExtensions() {
	const extensions: Extension[] = [];

	for (const extensionType of EXTENSION_TYPES) {
		const typeDir = extensionTypeToDir(extensionType);
		const typePath = path.join(env.EXTENSIONS_PATH, typeDir);

		try {
			const extensionNames = await listFolders(typePath);

			for (const extensionName of extensionNames) {
				const extensionPath = path.resolve(path.join(typePath, extensionName));

				extensions.push({
					path: extensionPath,
					name: extensionName,
					type: extensionType,
					entrypoint: 'index.js',
					local: true,
					root: true,
				});
			}
		} catch (err) {
			if (err.code === 'ENOENT') {
				throw new ServiceUnavailableException(`Extension folder "${typePath}" couldn't be opened`, {
					service: 'extensions',
				});
			}
			throw err;
		}
	}

	return extensions;
}

async function ensureDirsExist() {
	for (const extensionType of EXTENSION_TYPES) {
		const dirPath = path.resolve(env.EXTENSIONS_PATH, extensionTypeToDir(extensionType));
		try {
			await fse.ensureDir(dirPath);
		} catch (err) {
			logger.warn(err);
		}
	}
}

async function getSharedDepsMapping(deps: string[]) {
	const appDir = await fse.readdir(path.join(resolvePackage('@directus/app'), 'dist'));

	const depsMapping: Record<string, string> = {};
	for (const dep of deps) {
		const depName = appDir.find((file) => dep === file.substring(0, file.indexOf('.')));

		if (depName) {
			depsMapping[dep] = `${env.PUBLIC_URL}/admin/${depName}`;
		} else {
			logger.warn(`Couldn't find extension internal dependency "${dep}"`);
		}
	}

	return depsMapping;
}

function generateExtensionsEntry(type: AppExtensionType) {
	const filteredExtensions = extensions.filter((extension) => extension.type === type);

	return `${filteredExtensions
		.map((extension, i) => `import e${i} from '${path.resolve(extension.path, extension.entrypoint || '')}';\n`)
		.join('')}export default [${filteredExtensions.map((_, i) => `e${i}`).join(',')}];`;
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
