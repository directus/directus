import { ItemsService, QueryOptions } from './items';
import { AbstractServiceOptions, Query, PrimaryKey, PermissionsAction, Relation } from '../types';
import { PermissionsService } from './permissions';
import { toArray } from '../utils/to-array';

import { systemRelationRows } from '../database/system-data/relations';
import { ForbiddenException } from '../exceptions';

import logger from '../logger';

export class RelationsService extends ItemsService {
	permissionsService: PermissionsService;

	constructor(options: AbstractServiceOptions) {
		super('directus_relations', options);
		this.permissionsService = new PermissionsService(options);
	}

	/**
	 * Read multiple relations by query.
	 *
	 * Note: this is based on permissions access to other collections/fields, not permissions to
	 * directus_relations directly
	 */
	async readByQuery(query: Query, opts?: QueryOptions): Promise<Relation[]> {
		const service = new ItemsService<Relation>('directus_relations', {
			knex: this.knex,
			schema: this.schema,
			// We don't set accountability here. If you have read access to certain fields, you are
			// allowed to extract the relations regardless of permissions to directus_relations. This
			// happens in `filterForbidden` down below
		});

		const results = await service.readByQuery(query, opts);

		results.push(...systemRelationRows);

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

			if (allowedCollections.includes(relation.many_collection) === false) {
				collectionsAllowed = false;
			}

			if (relation.one_collection && allowedCollections.includes(relation.one_collection) === false) {
				collectionsAllowed = false;
			}

			if (
				relation.one_allowed_collections &&
				relation.one_allowed_collections.every((collection) => allowedCollections.includes(collection)) === false
			) {
				collectionsAllowed = false;
			}

			if (
				!allowedFields[relation.many_collection] ||
				(allowedFields[relation.many_collection].includes('*') === false &&
					allowedFields[relation.many_collection].includes(relation.many_field) === false)
			) {
				fieldsAllowed = false;
			}

			if (
				relation.one_collection &&
				relation.one_field &&
				(!allowedFields[relation.one_collection] ||
					(allowedFields[relation.one_collection].includes('*') === false &&
						allowedFields[relation.one_collection].includes(relation.one_field) === false))
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
