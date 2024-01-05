import { ForbiddenError, InvalidPayloadError, UnprocessableContentError } from '@directus/errors';
import type { ApiOutput, Extension, ExtensionSettings } from '@directus/extensions';
import type { SchemaInspector } from '@directus/schema';
import { createInspector } from '@directus/schema';
import type { Accountability, DeepPartial, SchemaOverview } from '@directus/types';
import Joi from 'joi';
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
			accountability: this.accountability,
		});

		this.systemCache = getCache().systemCache;
		this.helpers = getHelpers(this.knex);
	}

	async readAll() {
		const installedExtensions = this.extensionsManager.getExtensions();
		const configuredExtensions = await this.extensionsItemService.readByQuery({ limit: -1 });

		return this.stitch(installedExtensions, configuredExtensions);
	}

	async readOne(bundle: string | null, name: string) {
		const key = this.getKey(bundle, name);

		const schema = this.extensionsManager.getExtensions().find((extension) => extension.name === (bundle ?? name));
		const meta = await this.extensionsItemService.readOne(key);

		const stitched = this.stitch(schema ? [schema] : [], [meta])[0];

		if (stitched) return stitched;

		throw new ForbiddenError();
	}

	async updateOne(bundle: string | null, name: string, data: DeepPartial<ApiOutput>) {
		if (this.accountability?.admin !== true) {
			throw new ForbiddenError();
		}

		const key = this.getKey(bundle, name);

		const updateExtensionSchema = Joi.object({
			meta: Joi.object({
				enabled: Joi.boolean(),
			}),
		});

		const { error } = updateExtensionSchema.validate(data);

		if (error) {
			throw new InvalidPayloadError({ reason: error.message });
		}

		if ('meta' in data && 'enabled' in data.meta) {
			if (bundle === null) {
				await this.knex('directus_extensions').update({ enabled: data.meta.enabled }).where({ name: key });
				const extension = await this.readOne(bundle, name);

				if (extension.schema?.type === 'bundle') {
					// if a bundle is toggled, then toggle all of its children
					await this.knex('directus_extensions')
						.update({ enabled: data.meta.enabled })
						.where('name', 'LIKE', `${name}/%`);
				}

				this.extensionsManager.reload();
				return;
			}

			const parent = await this.readOne(null, bundle);

			if (parent.schema?.type !== 'bundle') {
				await this.knex('directus_extensions').update({ enabled: data.meta.enabled }).where({ name: key });

				this.extensionsManager.reload();
				return;
			}

			if (parent.schema.partial === false) {
				// if a bundle is non-partial do not allow toggling a child
				throw new UnprocessableContentError({
					reason: 'Unable to disable an entry for a bundle marked as non partial',
				});
			}

			await this.knex('directus_extensions').update({ enabled: data.meta.enabled }).where({ name: key });

			const child = await this.knex('directus_extensions')
				.where('name', 'LIKE', `${bundle}/%`)
				.where({ enabled: true })
				.first();

			if (!child && parent.meta.enabled) {
				// if all children are disabled then ensure parent bundle is disabled
				await this.knex('directus_extensions').update({ enabled: false }).where({ name: parent.name });
			} else if (child && !parent.meta.enabled) {
				// if at least one child is enabled then ensure parent bundle is enabled
				await this.knex('directus_extensions').update({ enabled: true }).where({ name: parent.name });
			}

			this.extensionsManager.reload();
		}
	}

	private getKey(bundle: string | null, name: string) {
		return bundle ? `${bundle}/${name}` : name;
	}

	/**
	 * Combine the settings stored in the database with the information available from the installed
	 * extensions into the standardized extensions api output
	 */
	private stitch(installed: Extension[], configured: ExtensionSettings[]): ApiOutput[] {
		/**
		 * On startup, the extensions manager will automatically create the rows for installed
		 * extensions that don't have configured settings yet, so there should always be equal or more
		 * settings rows than installed extensions.
		 */

		return configured.map((meta) => {
			let bundleName: string | null = null;
			let name = meta.name;

			if (name.includes('/')) {
				const parts = name.split('/');

				// NPM packages can have an optional organization scope in the format
				// `@<org>/<package>`. This is limited to a single `/`.
				//
				// `foo` -> extension
				// `foo/bar` -> bundle
				// `@rijk/foo` -> extension
				// `@rijk/foo/bar -> bundle

				const hasOrg = parts.at(0)!.startsWith('@');

				if (hasOrg && parts.length > 2) {
					name = parts.pop() as string;
					bundleName = parts.join('/');
				} else if (hasOrg === false) {
					[bundleName, name] = parts as [string, string];
				}
			}

			let schema;

			if (bundleName) {
				const bundle = installed.find((extension) => extension.name === bundleName);

				if (bundle && 'entries' in bundle) {
					const entry = bundle.entries.find((entry) => entry.name === name) ?? null;

					if (entry) {
						schema = {
							type: entry.type,
							local: bundle.local,
						};
					}
				} else {
					schema = null;
				}
			} else {
				schema = installed.find((extension) => extension.name === name) ?? null;
			}

			return {
				name,
				bundle: bundleName,
				schema: schema ? pick(schema, 'type', 'local', 'version', 'partial') : null,
				meta: omit(meta, 'name'),
			};
		});
	}
}
