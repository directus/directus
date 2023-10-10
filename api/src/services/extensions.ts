import type { ApiOutput, Extension, ExtensionSettings } from '@directus/extensions';
import type { SchemaInspector } from '@directus/schema';
import { createInspector } from '@directus/schema';
import type { Accountability, SchemaOverview } from '@directus/types';
import type Keyv from 'keyv';
import type { Knex } from 'knex';
import { omit, pick } from 'lodash-es';
import { getCache } from '../cache.js';
import type { Helpers } from '../database/helpers/index.js';
import { getHelpers } from '../database/helpers/index.js';
import getDatabase, { getSchemaInspector } from '../database/index.js';
import { getExtensionManager } from '../extensions/index.js';
import type { ExtensionManager } from '../extensions/manager.js';
import type { AbstractServiceOptions } from '../types/index.js';
import { ItemsService } from './items.js';
import { PermissionsService } from './permissions.js';

export class ExtensionsService {
	knex: Knex;
	permissionsService: PermissionsService;
	schemaInspector: SchemaInspector;
	accountability: Accountability | null;
	schema: SchemaOverview;
	extensionsItemService: ItemsService<ExtensionSettings>;
	systemCache: Keyv<any>;
	helpers: Helpers;
	extensionsManager: ExtensionManager;

	constructor(options: AbstractServiceOptions) {
		this.knex = options.knex || getDatabase();
		this.permissionsService = new PermissionsService(options);
		this.schemaInspector = options.knex ? createInspector(options.knex) : getSchemaInspector();
		this.schema = options.schema;
		this.accountability = options.accountability || null;
		this.extensionsManager = getExtensionManager();

		this.extensionsItemService = new ItemsService('directus_extensions', {
			knex: this.knex,
			schema: this.schema,
			// No accountability here, as every other method is hardcoded to be admin only
		});

		this.systemCache = getCache().systemCache;
		this.helpers = getHelpers(this.knex);
	}

	async readAll() {
		const installedExtensions = this.extensionsManager.getExtensions();
		const configuredExtensions = await this.extensionsItemService.readByQuery({ limit: -1 });

		return this.stitch(installedExtensions, configuredExtensions);
	}

	/**
	 * Combine the settings stored in the database with the information available from the installed
	 * extensions into the standardized extensions api output
	 */
	stitch(installed: Extension[], configured: ExtensionSettings[]): ApiOutput[] {
		/**
		 * On startup, the extensions manager will automatically create the rows for installed
		 * extensions that don't have configured settings yet, so there should always be equal or more
		 * settings rows than installed extensions.
		 */

		return configured.map((meta) => {
			let bundleName: string | null = null;
			let name = meta.name;

			if (name.includes('/')) {
				[bundleName, name] = name.split('/') as [string, string];
			}

			let schema;

			if (bundleName) {
				const bundle = installed.find((extension) => extension.name === bundleName);

				if (bundle && 'entries' in bundle) {
					schema = bundle.entries.find((entry) => entry.name === name) ?? null;
				} else {
					schema = null;
				}
			} else {
				schema = installed.find((extension) => extension.name === name) ?? null;
			}

			return {
				name,
				bundle: bundleName,
				schema: schema ? pick(schema, 'type', 'local') : null,
				meta: omit(meta, 'name'),
			};
		});
	}
}
