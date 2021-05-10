import { systemRelationRows } from '../database/system-data/relations';
import { ForbiddenException } from '../exceptions';
import logger from '../logger';
import { AbstractServiceOptions, PermissionsAction, PrimaryKey, Query, Relation, RelationMeta } from '../types';
import { toArray } from '../utils/to-array';
import { ItemsService, QueryOptions } from './items';
import { PermissionsService } from './permissions';
import { applyQueryPost } from '../utils/apply-query-post';
import SchemaInspector from '@directus/schema';

export class RelationsService extends ItemsService {
	permissionsService: PermissionsService;
	schemaInspector: ReturnType<typeof SchemaInspector>;

	constructor(options: AbstractServiceOptions) {
		super('directus_relations', options);
		this.permissionsService = new PermissionsService(options);
		this.schemaInspector = SchemaInspector(this.knex);
	}

	/**
	 * Read multiple relations. Just like collections/fields, this doesn't support a query (yet)
	 *
	 * Note: this is based on permissions access to other collections/fields, not permissions to
	 * directus_relations directly
	 */
	async readByQuery(query: Query, opts?: QueryOptions): Promise<Relation[]> {
		const service = new ItemsService<RelationMeta>('directus_relations', {
			knex: this.knex,
			schema: this.schema,
			// We don't set accountability here. If you have read access to certain fields, you are
			// allowed to extract the relations regardless of permissions to directus_relations. This
			// happens in `filterForbidden` down below
		});

		const metaRows = await service.readByQuery({ limit: -1 }, opts);
		metaRows.push(...systemRelationRows);

		const schemaRows = await this.schemaInspector.foreignKeys();

		const results = schemaRows.map(
			(foreignKey): Relation => {
				return {
					collection: foreignKey.table,
					field: foreignKey.column,
					related_collection: foreignKey.foreign_key_table,
					schema: foreignKey,
					meta: metaRows.find((meta) => {
						if (meta.many_collection !== foreignKey.table) return false;
						if (meta.many_field !== foreignKey.column) return false;
						if (meta.one_collection && meta.one_collection !== foreignKey.foreign_key_table) return false;
						return true;
					}),
				};
			}
		);

		/**
		 * Meta rows that don't have a corresponding schema foreign key
		 */
		const remainingMetaRows = metaRows
			.filter((meta) => {
				return !results.find((relation) => relation.meta === meta);
			})
			.map(
				(meta): Relation => {
					return {
						collection: meta.many_collection,
						field: meta.many_field,
						related_collection: meta.one_collection ?? null,
						meta: meta,
					};
				}
			);

		results.push(...remainingMetaRows);
		const filteredResults = await this.filterForbidden(results);
		return filteredResults;
	}

	/**
	 * Get a single relations row by key. This is based on your permissions to the collections/fields
	 * involved in the relation, not permissions to directus_relations
	 */
	async readOne(key: PrimaryKey, query?: Query, opts?: QueryOptions): Promise<Relation> {
		const service = new ItemsService<Relation>('directus_relations', {
			knex: this.knex,
			schema: this.schema,
			// We don't set accountability here. If you have read access to certain fields, you are
			// allowed to extract the relations regardless of permissions to directus_relations. This
			// happens in `filterForbidden` down below
		});

		const result = await service.readOne(key, query, opts);

		// No need to merge system relations here. They don't have PKs so can never be directly
		// targeted

		const filteredResults = await this.filterForbidden([result]);

		if (filteredResults.length === 1) return filteredResults[0];

		throw new ForbiddenException();
	}

	/**
	 * Get a single relations row by key. This is based on your permissions to the collections/fields
	 * involved in the relation, not permissions to directus_relations
	 */
	async readMany(keys: PrimaryKey[], query?: Query, opts?: QueryOptions): Promise<Relation[]> {
		const service = new ItemsService<Relation>('directus_relations', {
			knex: this.knex,
			schema: this.schema,
			// We don't set accountability here. If you have read access to certain fields, you are
			// allowed to extract the relations regardless of permissions to directus_relations. This
			// happens in `filterForbidden` down below
		});

		const result = await service.readMany(keys, query, opts);

		// No need to merge system relations here. They don't have PKs so can never be directly
		// targeted

		const filteredResults = await this.filterForbidden(result);
		if (filteredResults.length === 0) throw new ForbiddenException();
		return filteredResults;
	}

	/**
	 * Loop over all relations and filter out the ones that contain collections/fields you don't have
	 * permissions to
	 */
	private async filterForbidden(relations: Relation[]): Promise<Relation[]> {
		if (this.accountability === null || this.accountability?.admin === true) return relations;

		const allowedCollections = this.schema.permissions
			.filter((permission) => {
				return permission.action === 'read';
			})
			.map(({ collection }) => collection);

		const allowedFields = this.permissionsService.getAllowedFields('read');

		relations = toArray(relations);

		return relations.filter((relation) => {
			let collectionsAllowed = true;
			let fieldsAllowed = true;

			if (allowedCollections.includes(relation.collection) === false) {
				collectionsAllowed = false;
			}

			if (relation.related_collection && allowedCollections.includes(relation.related_collection) === false) {
				collectionsAllowed = false;
			}

			if (
				relation.meta?.one_allowed_collections &&
				relation.meta?.one_allowed_collections.every((collection) => allowedCollections.includes(collection)) === false
			) {
				collectionsAllowed = false;
			}

			if (
				!allowedFields[relation.collection] ||
				(allowedFields[relation.collection].includes('*') === false &&
					allowedFields[relation.collection].includes(relation.field) === false)
			) {
				fieldsAllowed = false;
			}

			if (
				relation.related_collection &&
				relation.meta?.one_field &&
				(!allowedFields[relation.related_collection] ||
					(allowedFields[relation.related_collection].includes('*') === false &&
						allowedFields[relation.related_collection].includes(relation.meta.one_field) === false))
			) {
				fieldsAllowed = false;
			}

			return collectionsAllowed && fieldsAllowed;
		});
	}

	/**
	 * @deprecated Use `readOne` or `readMany` instead
	 */
	readByKey(keys: PrimaryKey[], query?: Query, action?: PermissionsAction): Promise<Relation[]>;
	readByKey(key: PrimaryKey, query?: Query, action?: PermissionsAction): Promise<Relation>;
	async readByKey(
		key: PrimaryKey | PrimaryKey[],
		query: Query = {},
		action: PermissionsAction = 'read'
	): Promise<Relation | Relation[]> {
		logger.warn(
			'RelationsService.readByKey is deprecated and will be removed before v9.0.0. Use readOne or readMany instead.'
		);

		if (Array.isArray(key)) return await this.readMany(key, query, { permissionsAction: action });
		return await this.readOne(key, query, { permissionsAction: action });
	}
}
