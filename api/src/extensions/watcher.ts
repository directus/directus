import type { ExtensionManager } from './extensions.js';
import logger from '../logger.js';
import path from 'path';
import { isIn, isTypeIn, pluralize } from '@directus/utils';
import { HYBRID_EXTENSION_TYPES, JAVASCRIPT_FILE_EXTS, NESTED_EXTENSION_TYPES } from '@directus/constants';
import { pathToRelativeUrl } from '@directus/utils/node';
import env from '../env.js';
import chokidar, { FSWatcher } from 'chokidar';
import type { Extension } from '@directus/types';

export class WatcherManager {
	private extensionManager: ExtensionManager;
	private watcher: FSWatcher | null = null;

	constructor(extensionManager: ExtensionManager) {
		this.extensionManager = extensionManager;
	}

	public initializeWatcher(): void {
		logger.info('Watching extensions for changes...');

		const extensionDirUrl = pathToRelativeUrl(env['EXTENSIONS_PATH']);

		const localExtensionUrls = NESTED_EXTENSION_TYPES.flatMap((type) => {
			const typeDir = path.posix.join(extensionDirUrl, pluralize(type));

			if (isIn(type, HYBRID_EXTENSION_TYPES)) {
				return [
					path.posix.join(typeDir, '*', `app.{${JAVASCRIPT_FILE_EXTS.join()}}`),
					path.posix.join(typeDir, '*', `api.{${JAVASCRIPT_FILE_EXTS.join()}}`),
				];
			} else {
				return path.posix.join(typeDir, '*', `index.{${JAVASCRIPT_FILE_EXTS.join()}}`);
			}
		});

		this.watcher = chokidar.watch(
			[path.resolve('package.json'), path.posix.join(extensionDirUrl, '*', 'package.json'), ...localExtensionUrls],
			{
				ignoreInitial: true,
			}
		);

		this.watcher
			.on('add', () => this.extensionManager.reload())
			.on('change', () => this.extensionManager.reload())
			.on('unlink', () => this.extensionManager.reload());
	}

	public async closeWatcher(): Promise<void> {
		if (this.watcher) {
			await this.watcher.close();
			this.watcher = null;
		}
	}

	public updateWatchedExtensions(added: Extension[], removed: Extension[] = []): void {
		if (this.watcher) {
			const toPackageExtensionPaths = (extensions: Extension[]) =>
				extensions
					.filter((extension) => !extension.local || extension.type === 'bundle')
					.flatMap((extension) =>
						isTypeIn(extension, HYBRID_EXTENSION_TYPES) || extension.type === 'bundle'
							? [
									path.resolve(extension.path, extension.entrypoint.app),
									path.resolve(extension.path, extension.entrypoint.api),
							  ]
							: path.resolve(extension.path, extension.entrypoint)
					);

			const addedPackageExtensionPaths = toPackageExtensionPaths(added);
			const removedPackageExtensionPaths = toPackageExtensionPaths(removed);

			this.watcher.add(addedPackageExtensionPaths);
			this.watcher.unwatch(removedPackageExtensionPaths);
		}
	}
}
