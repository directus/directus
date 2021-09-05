import path from 'path';
import fse from 'fs-extra';
import { Extension, ExtensionManifestRaw, ExtensionPackageType, ExtensionType } from '../../types';
import { resolvePackage } from './resolve-package';
import { listFolders } from './list-folders';
import { EXTENSION_NAME_REGEX, EXTENSION_PKG_KEY } from '../../constants';
import { pluralize } from '../pluralize';
import { validateExtensionManifest } from '../validate-extension-manifest';

export async function getPackageExtensions(root: string, types: readonly ExtensionPackageType[]): Promise<Extension[]> {
	let pkg: { dependencies?: Record<string, string> };

	try {
		pkg = await fse.readJSON(path.resolve(root, 'package.json'));
	} catch {
		throw new Error('Current folder does not contain a package.json file');
	}

	const extensionNames = Object.keys(pkg.dependencies ?? {}).filter((dep) => EXTENSION_NAME_REGEX.test(dep));

	return listExtensionsChildren(extensionNames);

	async function listExtensionsChildren(extensionNames: string[], root?: string) {
		const extensions: Extension[] = [];

		for (const extensionName of extensionNames) {
			const extensionPath = resolvePackage(extensionName, root);
			const extensionManifest: ExtensionManifestRaw = await fse.readJSON(path.join(extensionPath, 'package.json'));

			if (!validateExtensionManifest(extensionManifest)) {
				throw new Error(`The extension manifest of "${extensionName}" is not valid.`);
			}

			if (types.includes(extensionManifest[EXTENSION_PKG_KEY].type)) {
				if (extensionManifest[EXTENSION_PKG_KEY].type === 'pack') {
					const extensionChildren = Object.keys(extensionManifest.dependencies ?? {}).filter((dep) =>
						EXTENSION_NAME_REGEX.test(dep)
					);

					const extension: Extension = {
						path: extensionPath,
						name: extensionName,
						version: extensionManifest.version,
						type: extensionManifest[EXTENSION_PKG_KEY].type,
						host: extensionManifest[EXTENSION_PKG_KEY].host,
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
						version: extensionManifest.version,
						type: extensionManifest[EXTENSION_PKG_KEY].type,
						entrypoint: extensionManifest[EXTENSION_PKG_KEY].path,
						host: extensionManifest[EXTENSION_PKG_KEY].host,
						local: false,
						root: root === undefined,
					});
				}
			}
		}

		return extensions;
	}
}

export async function getLocalExtensions(root: string, types: readonly ExtensionType[]): Promise<Extension[]> {
	const extensions: Extension[] = [];

	for (const extensionType of types) {
		const typeDir = pluralize(extensionType);
		const typePath = path.resolve(root, typeDir);

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
		} catch {
			throw new Error(`Extension folder "${typePath}" couldn't be opened`);
		}
	}

	return extensions;
}
