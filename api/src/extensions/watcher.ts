import type { ExtensionManager } from './extensions.js';
import logger from '../logger.js';
import path from 'path';
import { isTypeIn } from '@directus/utils';
import { HYBRID_EXTENSION_TYPES } from '@directus/constants';
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

	public isWatcherInitialized(): boolean {
		return this.watcher !== null;
	}

	public initializeWatcher(): void {
		logger.info('Watching extensions for changes...');

		const extensionDirUrl = pathToRelativeUrl(env['EXTENSIONS_PATH']);

		this.watcher = chokidar.watch(
			[path.resolve('package.json'), path.posix.join(extensionDirUrl, '*', 'package.json')],
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
