import { ItemsService } from './items';
import { AbstractServiceOptions, Query, PrimaryKey, PermissionsAction, Relation } from '../types';
import { PermissionsService } from './permissions';
import { toArray } from '../utils/to-array';

import { systemRelationRows } from '../database/system-data/relations';

/**
 * @TODO update foreign key constraints when relations are updated
 */

type ParsedRelation = Relation & {
	one_allowed_collections: string[] | null;
};

export class RelationsService extends ItemsService {
	permissionsService: PermissionsService;

	constructor(options: AbstractServiceOptions) {
		super('directus_relations', options);
		this.permissionsService = new PermissionsService(options);
	}

	async readByQuery(query: Query): Promise<null | Relation | Relation[]> {
		const service = new ItemsService('directus_relations', {
			knex: this.knex,
			schema: this.schema,
		});
		const results = (await service.readByQuery(query)) as ParsedRelation | ParsedRelation[] | null;

		if (results && Array.isArray(results)) {
			results.push(...(systemRelationRows as ParsedRelation[]));
		}

		const filteredResults = await this.filterForbidden(results);

		return filteredResults;
	}

	readByKey(keys: PrimaryKey[], query?: Query, action?: PermissionsAction): Promise<null | Relation[]>;
	readByKey(key: PrimaryKey, query?: Query, action?: PermissionsAction): Promise<null | Relation>;
	async readByKey(
		key: PrimaryKey | PrimaryKey[],
		query: Query = {},
		action: PermissionsAction = 'read'
	): Promise<null | Relation | Relation[]> {
		const service = new ItemsService('directus_relations', {
			knex: this.knex,
			schema: this.schema,
		});
		const results = (await service.readByKey(key as any, query, action)) as ParsedRelation | ParsedRelation[] | null;

		// No need to merge system relations here. They don't have PKs so can never be directly
		// targetted

		const filteredResults = await this.filterForbidden(results);
		return filteredResults;
	}

	private async filterForbidden(relations: ParsedRelation | ParsedRelation[] | null) {
		if (relations === null) return null;
		if (this.accountability === null || this.accountability?.admin === true) return relations;

		const allowedCollections = await this.permissionsService.getAllowedCollections(
			this.accountability?.role || null,
			'read'
		);

		const allowedFields = await this.permissionsService.getAllowedFields(this.accountability?.role || null, 'read');

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
}
