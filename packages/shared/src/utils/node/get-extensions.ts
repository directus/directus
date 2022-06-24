import path from 'path';
import fse from 'fs-extra';
import {
	ExtensionLocal,
	ExtensionManifestRaw,
	ExtensionPackage,
	ExtensionPackageType,
	ExtensionType,
} from '../../types';
import { resolvePackage } from './resolve-package';
import { listFolders } from './list-folders';
import { EXTENSION_NAME_REGEX, EXTENSION_PKG_KEY, HYBRID_EXTENSION_TYPES, PACK_EXTENSION_TYPE } from '../../constants';
import { pluralize } from '../pluralize';
import { validateExtensionManifest } from '../validate-extension-manifest';
import { isExtensionObject, isHybridExtension } from '../is-extension';

async function resolvePackageExtensions(
	extensionNames: string[],
	root: string,
	types: readonly ExtensionPackageType[]
): Promise<ExtensionPackage[]> {
	const extensions: ExtensionPackage[] = [];

	for (const extensionName of extensionNames) {
		const extensionPath = resolvePackage(extensionName, root);
		const extensionManifest: ExtensionManifestRaw = await fse.readJSON(path.join(extensionPath, 'package.json'));

		if (!validateExtensionManifest(extensionManifest)) {
			throw new Error(`The extension manifest of "${extensionName}" is not valid.`);
		}

		const extensionOptions = extensionManifest[EXTENSION_PKG_KEY];

		if (types.includes(extensionOptions.type)) {
			if (extensionOptions.type === PACK_EXTENSION_TYPE) {
				const extensionChildren = Object.keys(extensionManifest.dependencies ?? {}).filter((dep) =>
					EXTENSION_NAME_REGEX.test(dep)
				);

				const extension: ExtensionPackage = {
					path: extensionPath,
					name: extensionName,
					version: extensionManifest.version,
					type: extensionOptions.type,
					host: extensionOptions.host,
					children: extensionChildren,
					local: false,
				};

				extensions.push(extension);
				extensions.push(...(await resolvePackageExtensions(extension.children || [], extension.path, types)));
			} else if (isExtensionObject(extensionOptions, HYBRID_EXTENSION_TYPES)) {
				extensions.push({
					path: extensionPath,
					name: extensionName,
					version: extensionManifest.version,
					type: extensionOptions.type,
					entrypoint: {
						app: extensionOptions.path.app,
						api: extensionOptions.path.api,
					},
					host: extensionOptions.host,
					local: false,
				});
			} else {
				extensions.push({
					path: extensionPath,
					name: extensionName,
					version: extensionManifest.version,
					type: extensionOptions.type,
					entrypoint: extensionOptions.path,
					host: extensionOptions.host,
					local: false,
				});
			}
		}
	}

	return extensions;
}

export async function getPackageExtensions(
	root: string,
	types: readonly ExtensionPackageType[]
): Promise<ExtensionPackage[]> {
	let pkg: { dependencies?: Record<string, string> };

	try {
		pkg = await fse.readJSON(path.resolve(root, 'package.json'));
	} catch {
		throw new Error('Current folder does not contain a package.json file');
	}

	const extensionNames = Object.keys(pkg.dependencies ?? {}).filter((dep) => EXTENSION_NAME_REGEX.test(dep));

	return resolvePackageExtensions(extensionNames, root, types);
}

export async function getLocalExtensions(root: string, types: readonly ExtensionType[]): Promise<ExtensionLocal[]> {
	const extensions: ExtensionLocal[] = [];

	for (const extensionType of types) {
		const typeDir = pluralize(extensionType);
		const typePath = path.resolve(root, typeDir);

		try {
			const extensionNames = await listFolders(typePath);

			for (const extensionName of extensionNames) {
				const extensionPath = path.join(typePath, extensionName);

				if (!isHybridExtension(extensionType)) {
					extensions.push({
						path: extensionPath,
						name: extensionName,
						type: extensionType,
						entrypoint: 'index.js',
						local: true,
					});
				} else {
					extensions.push({
						path: extensionPath,
						name: extensionName,
						type: extensionType,
						entrypoint: {
							app: 'app.js',
							api: 'api.js',
						},
						local: true,
					});
				}
			}
		} catch {
			throw new Error(`Extension folder "${typePath}" couldn't be opened`);
		}
	}

	return extensions;
}
