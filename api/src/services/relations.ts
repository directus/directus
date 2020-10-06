import { ItemsService } from './items';
import {
	AbstractServiceOptions,
	Query,
	Item,
	PrimaryKey,
	PermissionsAction,
	Relation,
} from '../types';
import { PermissionsService } from './permissions';

/**
 * @TODO update foreign key constraints when relations are updated
 */

export class RelationsService extends ItemsService {
	permissionsService: PermissionsService;

	constructor(options?: AbstractServiceOptions) {
		super('directus_relations', options);
		this.permissionsService = new PermissionsService(options);
	}

	async readByQuery(query: Query): Promise<null | Item | Item[]> {
		const results = (await super.readByQuery(query)) as Relation | Relation[] | null;
		const filteredResults = await this.filterForbidden(results);
		return filteredResults;
	}

	readByKey(
		keys: PrimaryKey[],
		query?: Query,
		action?: PermissionsAction
	): Promise<null | Item[]>;
	readByKey(key: PrimaryKey, query?: Query, action?: PermissionsAction): Promise<null | Item>;
	async readByKey(
		key: PrimaryKey | PrimaryKey[],
		query: Query = {},
		action: PermissionsAction = 'read'
	): Promise<null | Item | Item[]> {
		const results = (await super.readByKey(key as any, query, action)) as
			| Relation
			| Relation[]
			| null;
		const filteredResults = await this.filterForbidden(results);
		return filteredResults;
	}

	private async filterForbidden(relations: Relation | Relation[] | null) {
		if (relations === null) return null;
		if (this.accountability === null || this.accountability?.admin === true) return relations;

		const allowedCollections = await this.permissionsService.getAllowedCollections(
			this.accountability?.role || null,
			'read'
		);
		const allowedFields = await this.permissionsService.getAllowedFields(
			this.accountability?.role || null,
			'read'
		);

		relations = Array.isArray(relations) ? relations : [relations];

		return relations.filter((relation) => {
			const collectionsAllowed =
				allowedCollections.includes(relation.many_collection) &&
				allowedCollections.includes(relation.one_collection);

			const fieldsAllowed =
				allowedFields[relation.one_collection] &&
				allowedFields[relation.many_collection] &&
				(allowedFields[relation.many_collection].includes('*') ||
					allowedFields[relation.many_collection].includes(relation.many_field)) &&
				(allowedFields[relation.one_collection].includes('*') ||
					allowedFields[relation.one_collection].includes(relation.one_field));

			return collectionsAllowed && fieldsAllowed;
		});
	}
}
