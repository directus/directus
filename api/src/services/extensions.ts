import { useEnv } from '@directus/env';
import { ForbiddenError, InvalidPayloadError, LimitExceededError, UnprocessableContentError } from '@directus/errors';
import { describe, type DescribeOptions } from '@directus/extensions-registry';
import type { ApiOutput, BundleExtension, ExtensionManager, ExtensionSettings } from '@directus/types';
import type { AbstractServiceOptions, Accountability, DeepPartial, SchemaOverview } from '@directus/types';
import { isObject } from '@directus/utils';
import type { Knex } from 'knex';
import getDatabase from '../database/index.js';
import { getExtensionManager } from '../extensions/index.js';
import { transaction } from '../utils/transaction.js';
import { ItemsService } from './items.js';

export class ExtensionReadError extends Error {
	originalError: unknown;
	constructor(originalError: unknown) {
		super();
		this.originalError = originalError;
	}
}

export class ExtensionsService {
	knex: Knex;
	accountability: Accountability | null;
	schema: SchemaOverview;
	extensionsItemService: ItemsService<ExtensionSettings>;
	extensionsManager: ExtensionManager;

	constructor(options: AbstractServiceOptions) {
		this.knex = options.knex || getDatabase();
		this.schema = options.schema;
		this.accountability = options.accountability || null;
		this.extensionsManager = getExtensionManager();

		this.extensionsItemService = new ItemsService('directus_extensions', {
			knex: this.knex,
			schema: this.schema,
			accountability: this.accountability,
		});
	}

	private async preInstall(extensionId: string, versionId: string) {
		const env = useEnv();

		const describeOptions: DescribeOptions = {};

		if (typeof env['MARKETPLACE_REGISTRY'] === 'string') {
			describeOptions.registry = env['MARKETPLACE_REGISTRY'];
		}

		const extension = await describe(extensionId, describeOptions);
		const version = extension.data.versions.find((version) => version.id === versionId);

		if (!version) {
			throw new ForbiddenError();
		}

		const limit = env['EXTENSIONS_LIMIT'] ? Number(env['EXTENSIONS_LIMIT']) : null;

		if (limit !== null) {
			const currentlyInstalledCount = this.extensionsManager.extensions.length;

			/**
			 * Bundle extensions should be counted as the number of nested entries rather than a single
			 * extension to avoid a vulnerability where you can get around the technical limit by bundling
			 * all extensions you want
			 */
			const points = version.bundled.length ?? 1;

			const afterInstallCount = currentlyInstalledCount + points;

			if (afterInstallCount >= limit) {
				throw new LimitExceededError({ category: 'Extensions' });
			}
		}

		return { extension, version };
	}

	async install(extensionId: string, versionId: string) {
		const { extension, version } = await this.preInstall(extensionId, versionId);

		await this.extensionsItemService.createOne({
			id: extensionId,
			enabled: true,
			folder: versionId,
			source: 'registry',
			bundle: null,
		});

		if (extension.data.type === 'bundle' && version.bundled.length > 0) {
			await this.extensionsItemService.createMany(
				version.bundled.map((entry) => ({
					enabled: true,
					folder: entry.name,
					source: 'registry',
					bundle: extensionId,
				})),
			);
		}

		await this.extensionsManager.install(versionId);
	}

	async uninstall(id: string) {
		const settings = await this.extensionsItemService.readOne(id);

		if (settings.source !== 'registry') {
			throw new InvalidPayloadError({
				reason: 'Cannot uninstall extensions that were not installed via marketplace',
			});
		}

		if (settings.bundle !== null) {
			throw new InvalidPayloadError({
				reason: 'Cannot uninstall sub extensions of bundles separately',
			});
		}

		await this.deleteOne(id);
		await this.extensionsManager.uninstall(settings.folder);
	}

	async reinstall(id: string) {
		const settings = await this.extensionsItemService.readOne(id);

		if (settings.source !== 'registry') {
			throw new InvalidPayloadError({
				reason: 'Cannot reinstall extensions that were not installed via marketplace',
			});
		}

		if (settings.bundle !== null) {
			throw new InvalidPayloadError({
				reason: 'Cannot reinstall sub extensions of bundles separately',
			});
		}

		const extensionId = settings.id;
		const versionId = settings.folder;

		await this.preInstall(extensionId, versionId);
		await this.extensionsManager.install(versionId);
	}

	async readAll() {
		// wait for extensions to be reloaded
		await this.extensionsManager.isReloading();

		const settings = await this.extensionsItemService.readByQuery({ limit: -1 });

		const regular = settings.filter(({ bundle }) => bundle === null);
		const bundled = settings.filter(({ bundle }) => bundle !== null);

		const output: ApiOutput[] = [];

		for (const meta of regular) {
			output.push({
				id: meta.id,
				bundle: meta.bundle,
				meta: meta,
				schema: this.extensionsManager.getExtension(meta.source, meta.folder) ?? null,
			});
		}

		for (const meta of bundled) {
			const parentBundle = output.find((ext) => ext.id === meta.bundle);

			if (!parentBundle) continue;

			const schema = (parentBundle.schema as BundleExtension | null)?.entries.find(
				(entry) => entry.name === meta.folder,
			);

			if (!schema) continue;

			output.push({
				id: meta.id,
				bundle: meta.bundle,
				meta: meta,
				schema: schema,
			});
		}

		return output;
	}

	async readOne(id: string): Promise<ApiOutput> {
		// wait for extensions to be reloaded
		await this.extensionsManager.isReloading();
		const meta = await this.extensionsItemService.readOne(id);
		const schema = this.extensionsManager.getExtension(meta.source, meta.folder) ?? null;

		return {
			id: meta.id,
			bundle: meta.bundle,
			schema,
			meta,
		};
	}

	async updateOne(id: string, data: DeepPartial<ApiOutput>) {
		const result = await transaction(this.knex, async (trx) => {
			if (!isObject(data.meta)) {
				throw new InvalidPayloadError({ reason: `"meta" is required` });
			}

			const service = new ExtensionsService({
				knex: trx,
				accountability: this.accountability,
				schema: this.schema,
			});

			await service.extensionsItemService.updateOne(id, data.meta);

			let extension;

			try {
				extension = await service.readOne(id);
			} catch (error) {
				throw new ExtensionReadError(error);
			}

			if ('enabled' in data.meta) {
				await service.checkBundleAndSyncStatus(trx, id, extension);
			}

			return extension;
		});

		this.extensionsManager.reload().then(() => {
			this.extensionsManager.broadcastReloadNotification();
		});

		return result;
	}

	async deleteOne(id: string) {
		await this.extensionsItemService.deleteOne(id);
		await this.extensionsItemService.deleteByQuery({ filter: { bundle: { _eq: id } } });
	}

	/**
	 * Sync a bundles enabled status
	 *  - If the extension or extensions parent is not a bundle changes are skipped
	 *  - If a bundles status is toggled, all children are set to that status
	 *  - If an entries status is toggled, then if the:
	 *    - Parent bundle is non-partial throws UnprocessableContentError
	 *    - Entry status change resulted in all children being disabled then the parent bundle is disabled
	 *    - Entry status change resulted in at least one child being enabled then the parent bundle is enabled
	 */
	private async checkBundleAndSyncStatus(trx: Knex, extensionId: string, extension: ApiOutput) {
		if (extension.bundle === null && extension.schema?.type === 'bundle') {
			// If extension is the parent bundle, set it and all nested extensions to enabled
			await trx('directus_extensions')
				.update({ enabled: extension.meta.enabled })
				.where({ bundle: extensionId })
				.orWhere({ id: extensionId });

			return;
		}

		const parentId = extension.bundle ?? extension.meta.bundle;

		if (!parentId) return;

		const parent = await this.readOne(parentId);

		if (parent.schema?.type !== 'bundle') {
			return;
		}

		if (parent.schema.partial === false) {
			throw new UnprocessableContentError({
				reason: 'Unable to toggle status of an entry for a bundle marked as non partial',
			});
		}

		const hasEnabledChildren = !!(await trx('directus_extensions')
			.where({ bundle: parentId })
			.where({ enabled: true })
			.first());

		if (hasEnabledChildren) {
			await trx('directus_extensions').update({ enabled: true }).where({ id: parentId });
		} else {
			await trx('directus_extensions').update({ enabled: false }).where({ id: parentId });
		}
	}
}
