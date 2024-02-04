import { InvalidPayloadError, UnprocessableContentError } from '@directus/errors';
import type { ApiOutput, ExtensionSettings } from '@directus/extensions';
import type { Accountability, DeepPartial, SchemaOverview } from '@directus/types';
import { isObject } from '@directus/utils';
import type { Knex } from 'knex';
import getDatabase from '../database/index.js';
import { getExtensionManager } from '../extensions/index.js';
import type { ExtensionManager } from '../extensions/manager.js';
import type { AbstractServiceOptions } from '../types/index.js';
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

	async readAll() {
		const meta = await this.extensionsItemService.readByQuery({ limit: -1 });

		return meta.map(
			(settings) =>
				<ApiOutput>{
					id: settings.id,
					bundle: settings.bundle,
					meta: settings,
					schema: this.extensionsManager.getExtension(settings.source, settings.folder) ?? null,
				},
		);
	}

	async readOne(id: string): Promise<ApiOutput> {
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
		const result = await this.knex.transaction(async (trx) => {
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

		this.extensionsManager.reload();

		return result;
	}

	async deleteOne(id: string) {
		const settings = await this.extensionsItemService.readOne(id);

		if (settings.source !== 'registry') {
			throw new InvalidPayloadError({
				reason: 'Cannot uninstall extensions that were not installed from the marketplace registry',
			});
		}

		await this.extensionsItemService.deleteOne(id);
		await this.extensionsManager.uninstall(settings.folder);
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
	private async checkBundleAndSyncStatus(trx: Knex, bundleId: string, extension: ApiOutput) {
		if (extension.bundle === null && extension.schema?.type === 'bundle') {
			// If extension is the parent bundle, set it and all nested extensions to enabled
			await trx('directus_extensions')
				.update({ enabled: extension.meta.enabled })
				.where({ bundle: bundleId })
				.orWhere({ id: bundleId });

			return;
		}

		const parent = await this.readOne(bundleId);

		if (parent.schema?.type !== 'bundle') {
			return;
		}

		if (parent.schema.partial === false) {
			throw new UnprocessableContentError({
				reason: 'Unable to toggle status of an entry for a bundle marked as non partial',
			});
		}

		const hasEnabledChildren = !!(await trx('directus_extensions')
			.where({ bundle: bundleId })
			.where({ enabled: true })
			.first());

		if (hasEnabledChildren) {
			await trx('directus_extensions').update({ enabled: true }).where({ id: bundleId });
		} else {
			await trx('directus_extensions').update({ enabled: false }).where({ id: bundleId });
		}
	}
}
