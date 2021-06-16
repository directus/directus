import express, { Router } from 'express';
import path from 'path';
import getDatabase from './database';
import emitter from './emitter';
import env from './env';
import * as exceptions from './exceptions';
import { ServiceUnavailableException } from './exceptions';
import logger from './logger';
import { Extension, ExtensionType, ExtensionDir, HookRegisterFunction, EndpointRegisterFunction } from './types';
import fse from 'fs-extra';
import { getSchema } from './utils/get-schema';
import { EXTENSION_NAME } from './constants';

import * as services from './services';
import listFolders from './utils/list-folders';
import { schedule, validate } from 'node-cron';
import { resolvePackage } from './utils/resolve-package';

let extensions: Extension[] = [];
const internalDeps: Record<string, string> = {};

export async function initializeExtensions(): Promise<void> {
	await ensureFoldersExist();
	await resolveInternalDeps();
	await discoverExtensions();

	logger.info(`Loaded extensions: ${listExtensions().join(', ')}`);
}

export async function discoverExtensions(): Promise<void> {
	extensions = [...(await listPackageExtensions()), ...(await listLocalExtensions())];
}

export function listExtensions(type?: ExtensionType): string[] {
	if (type === undefined) {
		return extensions.map((extension) => extension.name);
	} else {
		return extensions.filter((extension) => extension.type === type).map((extension) => extension.name);
	}
}

export function findExtension(type: ExtensionType, name: string): Extension | undefined {
	return extensions.find((extension) => extension.type === type && extension.name === name);
}

export async function readExtensionSource(extension: Extension): Promise<string> {
	const extensionPath = path.resolve(extension.path, extension.entrypoint || '');
	const extensionSource = await fse.readFile(extensionPath, { encoding: 'utf8' });

	return transformInternalImports(extensionSource);
}

export function registerExtensionEndpoints(router: Router): void {
	const endpoints = extensions.filter((extension) => extension.type === 'endpoint');
	registerEndpoints(endpoints, router);
}

export function registerExtensionHooks(): void {
	const hooks = extensions.filter((extension) => extension.type === 'hook');
	registerHooks(hooks);
}

export function extensionDirToType(dir: ExtensionDir<ExtensionType>): ExtensionType {
	return dir.slice(0, -1) as ExtensionType;
}

export function extensionTypeToDir(type: ExtensionType): ExtensionDir<ExtensionType> {
	return `${type}s` as ExtensionDir<ExtensionType>;
}

async function listPackageExtensions() {
	const pkg = await fse.readJSON(path.resolve('./package.json'));
	const extensionNames = Object.keys(pkg.dependencies).filter((dep) => EXTENSION_NAME.test(dep));

	return listExtensionsChildren(extensionNames);

	async function listExtensionsChildren(extensionNames: string[], root?: string) {
		const extensions: Extension[] = [];

		for (const extensionName of extensionNames) {
			const extensionPath = resolvePackage(extensionName, root);
			const extensionPkg = await fse.readJSON(path.join(extensionPath, 'package.json'));

			if (extensionPkg['directus:extension'].type === 'pack') {
				const extensionChildren = Object.keys(extensionPkg.dependencies).filter((dep) => EXTENSION_NAME.test(dep));

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

async function listLocalExtensions() {
	const extensions: Extension[] = [];

	const extensionTypes: ExtensionType[] = ['endpoint', 'hook', 'interface', 'display', 'layout', 'module'];

	for (const extensionType of extensionTypes) {
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

async function ensureFoldersExist() {
	const folders = ['endpoints', 'hooks', 'interfaces', 'displays', 'layouts', 'modules'];

	for (const folder of folders) {
		const folderPath = path.resolve(env.EXTENSIONS_PATH, folder);
		try {
			await fse.ensureDir(folderPath);
		} catch (err) {
			logger.warn(err);
		}
	}
}

async function resolveInternalDeps() {
	const deps = ['vue'];

	const appDir = await fse.readdir(path.join(resolvePackage('@directus/app'), 'dist'));

	for (const dep of deps) {
		const depName = appDir.find((file) => dep === file.substring(0, file.indexOf('.')));

		if (depName) {
			internalDeps[dep] = `${env.PUBLIC_URL}/admin/${depName}`;
		} else {
			logger.warn(`Couldn't find extension internal dependency "${dep}"`);
		}
	}
}

function transformInternalImports(src: string) {
	const importRegex = new RegExp(
		`((?:^|;\\s*|(?:\\r?\\n)+)import(?:[a-z0-9_$,*{}\\s]*from)?\\s*['"\`])(${Object.keys(internalDeps).join(
			'|'
		)})(['"\`])`,
		'gi'
	);

	return src.replace(importRegex, (_, pre: string, dep: string, post: string) => `${pre}${internalDeps[dep]}${post}`);
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
