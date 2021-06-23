import path from 'path';
import fse from 'fs-extra';
import { Extension } from '../types';
import { resolvePackage } from './resolve-package';
import { listFolders } from './list-folders';
import { EXTENSION_NAME_REGEX, EXTENSION_TYPES } from '../constants';
import { pluralize } from './pluralize';

export async function getPackageExtensions(root: string): Promise<Extension[]> {
	const pkg = await fse.readJSON(path.resolve(path.join(root, 'package.json')));
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

export async function getLocalExtensions(root: string): Promise<Extension[]> {
	const extensions: Extension[] = [];

	for (const extensionType of EXTENSION_TYPES) {
		const typeDir = pluralize(extensionType);
		const typePath = path.resolve(path.join(root, typeDir));

		try {
			const extensionNames = await listFolders(typePath);

			for (const extensionName of extensionNames) {
				const extensionPath = path.join(typePath, extensionName);

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
			if (err.code === 'ENOENT') throw new Error(`Extension folder "${typePath}" couldn't be opened`);
			throw err;
		}
	}

	return extensions;
}
