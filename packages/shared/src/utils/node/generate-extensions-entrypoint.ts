import path from 'path';
import { HYBRID_EXTENSION_TYPES, APP_EXTENSION_TYPES } from '../../constants';
import { AppExtension, BundleExtension, Extension, HybridExtension } from '../../types';
import { isIn, isTypeIn } from '../array-helpers';
import { pluralize } from '../pluralize';
import { pathToRelativeUrl } from './path-to-relative-url';

export function generateExtensionsEntrypoint(extensions: Extension[]): string {
	const appOrHybridExtensions = extensions.filter((extension): extension is AppExtension | HybridExtension =>
		isIn(extension.type, [...APP_EXTENSION_TYPES, ...HYBRID_EXTENSION_TYPES])
	);

	const bundleExtensions = extensions.filter(
		(extension): extension is BundleExtension =>
			extension.type === 'bundle' &&
			extension.entries.some((entry) => isIn(entry.type, [...APP_EXTENSION_TYPES, ...HYBRID_EXTENSION_TYPES]))
	);

	const appOrHybridExtensionImports = [...APP_EXTENSION_TYPES, ...HYBRID_EXTENSION_TYPES].flatMap((type) =>
		appOrHybridExtensions
			.filter((extension) => extension.type === type)
			.map(
				(extension, i) =>
					`import ${type}${i} from './${pathToRelativeUrl(
						path.resolve(
							extension.path,
							isTypeIn(extension, HYBRID_EXTENSION_TYPES) ? extension.entrypoint.app : extension.entrypoint
						)
					)}';`
			)
	);

	const bundleExtensionImports = bundleExtensions.map(
		(extension, i) =>
			`import {${[...APP_EXTENSION_TYPES, ...HYBRID_EXTENSION_TYPES]
				.filter((type) => extension.entries.some((entry) => entry.type === type))
				.map((type) => `${pluralize(type)} as ${type}Bundle${i}`)
				.join(',')}} from './${pathToRelativeUrl(path.resolve(extension.path, extension.entrypoint.app))}';`
	);

	const extensionExports = [...APP_EXTENSION_TYPES, ...HYBRID_EXTENSION_TYPES].map(
		(type) =>
			`export const ${pluralize(type)} = [${appOrHybridExtensions
				.filter((extension) => extension.type === type)
				.map((_, i) => `${type}${i}`)
				.concat(
					bundleExtensions
						.map((extension, i) =>
							extension.entries.some((entry) => entry.type === type) ? `...${type}Bundle${i}` : null
						)
						.filter((e): e is string => e !== null)
				)
				.join(',')}];`
	);

	return `${appOrHybridExtensionImports.join('')}${bundleExtensionImports.join('')}${extensionExports.join('')}`;
}
