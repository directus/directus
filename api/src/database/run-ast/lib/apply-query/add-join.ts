import { InvalidQueryError } from '@directus/errors';
import type { SchemaOverview } from '@directus/types';
import { getRelationInfo } from '@directus/utils';
import type { Knex } from 'knex';
import { clone } from 'lodash-es';
import { isVersionedCollection } from '../../../../services/versions/is-versioned-collection.js';
import { toVersionedCollectionName } from '../../../../services/versions/to-versioned-collection-name.js';
import { toVersionedRelationName } from '../../../../services/versions/to-versioned-relation-name.js';
import type { AliasMap } from '../../../../utils/get-column-path.js';
import { getHelpers } from '../../../helpers/index.js';
import { generateJoinAlias } from '../../utils/generate-alias.js';

/**
 * Apply a given filter object to the Knex QueryBuilder instance.
 *
 * Relational nested filters, like the following example:
 *
 * ```json
 * // Fetch pages that have articles written by Rijk
 *
 * {
 *   "articles": {
 *     "author": {
 *       "name": {
 *         "_eq": "Rijk"
 *       }
 *     }
 *   }
 * }
 * ```
 *
 * are handled by joining the nested tables, and using a where statement on the top level on the
 * nested field through the join. This allows us to filter the top level items based on nested data.
 * The where on the root is done with a subquery to prevent duplicates, any nested joins are done
 * with aliases to prevent naming conflicts.
 *
 * The output SQL for the above would look something like:
 *
 * ```sql
 * SELECT *
 * FROM pages
 * WHERE
 *   pages.id in (
 *     SELECT articles.page_id AS page_id
 *     FROM articles
 *     LEFT JOIN authors AS xviqp ON articles.author = xviqp.id
 *     WHERE xviqp.name = 'Rijk'
 *   )
 * ```
 */

type AddJoinProps = {
	path: string[];
	collection: string;
	aliasMap: AliasMap;
	rootQuery: Knex.QueryBuilder;
	schema: SchemaOverview;
	knex: Knex;
};

export function addJoin({ path, collection, aliasMap, rootQuery, schema, knex }: AddJoinProps) {
	let hasMultiRelational = false;
	let isJoinAdded = false;

	path = clone(path);
	followRelation(path);

	return { hasMultiRelational, isJoinAdded };

	function followRelation(pathParts: string[], parentCollection: string = collection, parentFields?: string) {
		/**
		 * For A2M fields, the path can contain an optional collection scope <field>:<scope>
		 */
		const pathRoot = pathParts[0]!.split(':')[0]!;

		const { relation, relationType } = getRelationInfo(schema.relations, parentCollection, pathRoot);

		if (!relation) {
			return;
		}

		const existingAlias = parentFields
			? aliasMap[`${parentFields}.${pathParts[0]}`]?.alias
			: aliasMap[pathParts[0]!]?.alias;

		if (!existingAlias) {
			const alias = generateJoinAlias(parentCollection, pathParts, relationType, parentFields);
			const aliasKey = parentFields ? `${parentFields}.${pathParts[0]}` : pathParts[0]!;
			const aliasedParentCollection = aliasMap[parentFields ?? '']?.alias || parentCollection;

			aliasMap[aliasKey] = { alias, collection: '' };

			if (relationType === 'm2o') {
				rootQuery.leftJoin(
					{ [alias]: relation.related_collection! },
					`${aliasedParentCollection}.${relation.field}`,
					`${alias}.${schema.collections[relation.related_collection!]!.primary}`,
				);

				aliasMap[aliasKey]!.collection = relation.related_collection!;

				/**
				 * When the current collection is a version table and the M2O pointer collection is versioned,
				 * an extra join is added to query the versioned related collection.
				 * This ensures a single query can return results if either the main record or its version matches the filter.
				 */
				if (isVersionedCollection(parentCollection) && schema.collections[relation.related_collection!]?.versioning) {
					const versionRelationField = toVersionedRelationName(pathParts[0]!);
					const versionCollection = toVersionedCollectionName(relation.related_collection!);
					const versionPathParts = pathParts.with(0, versionRelationField);

					const versionAlias = generateJoinAlias(parentCollection, versionPathParts, relationType, parentFields);
					const versionAliasKey = parentFields ? `${parentFields}.${versionRelationField}` : `${versionRelationField}`;

					aliasMap[versionAliasKey] = { alias: versionAlias, collection: versionCollection };

					rootQuery.leftJoin(
						{ [versionAlias]: versionCollection },
						`${aliasedParentCollection}.${toVersionedRelationName(relation.field)}`,
						`${versionAlias}.${schema.collections[versionCollection]?.primary}`,
					);
				}

				isJoinAdded = true;
			} else if (relationType === 'a2o') {
				const pathScope = pathParts[0]!.split(':')[1];

				if (!pathScope) {
					throw new InvalidQueryError({
						reason: `You have to provide a collection scope when sorting or filtering on a many-to-any item`,
					});
				}

				rootQuery.leftJoin({ [alias]: pathScope }, (joinClause) => {
					joinClause
						.onVal(`${aliasedParentCollection}.${relation.meta!.one_collection_field!}`, '=', pathScope)
						.andOn(
							`${aliasedParentCollection}.${relation.field}`,
							'=',
							knex.raw(
								getHelpers(knex).schema.castA2oPrimaryKey(),
								`${alias}.${schema.collections[pathScope]!.primary}`,
							),
						);
				});

				aliasMap[aliasKey]!.collection = pathScope;

				/**
				 * When the current collection is a version table and the A2O target collection is versioned,
				 * an extra join is added to query the versioned target collection.
				 * This ensures a single query can return results if either the main record or its version matches the filter.
				 */
				if (isVersionedCollection(parentCollection) && schema.collections[pathScope]?.versioning) {
					const versionRelationField = toVersionedRelationName(pathParts[0]!);
					const versionPathScope = toVersionedCollectionName(pathScope);
					const versionPathParts = pathParts.with(0, versionRelationField);

					const versionAlias = generateJoinAlias(parentCollection, versionPathParts, relationType, parentFields);
					const versionAliasKey = parentFields ? `${parentFields}.${versionRelationField}` : versionRelationField;

					aliasMap[versionAliasKey] = { alias: versionAlias, collection: versionPathScope };

					rootQuery.leftJoin({ [versionAlias]: versionPathScope }, (joinClause) => {
						joinClause
							.onVal(
								`${aliasedParentCollection}.${toVersionedRelationName(relation.meta!.one_collection_field!)}`,
								'=',
								versionPathScope,
							)
							.andOn(
								`${aliasedParentCollection}.${toVersionedRelationName(relation.field)}`,
								'=',
								knex.raw(
									getHelpers(knex).schema.castA2oPrimaryKey(),
									`${versionAlias}.${schema.collections[versionPathScope]!.primary}`,
								),
							);
					});
				}

				isJoinAdded = true;
			} else if (relationType === 'o2a') {
				rootQuery.leftJoin({ [alias]: relation.collection }, (joinClause) => {
					joinClause
						.onVal(`${alias}.${relation.meta!.one_collection_field!}`, '=', parentCollection)
						.andOn(
							`${alias}.${relation.field}`,
							'=',
							knex.raw(
								getHelpers(knex).schema.castA2oPrimaryKey(),
								`${aliasedParentCollection}.${schema.collections[parentCollection]!.primary}`,
							),
						);
				});

				aliasMap[aliasKey]!.collection = relation.collection;

				/**
				 * When the current collection is a version table and the O2A child collection is versioned,
				 * an extra join is added to query the versioned child collection.
				 * This ensures a single query can return results if either the main record or its version matches the filter.
				 */
				if (isVersionedCollection(parentCollection) && schema.collections[relation.collection]?.versioning) {
					const versionRelationField = toVersionedRelationName(pathParts[0]!);
					const versionCollection = toVersionedCollectionName(relation.collection);
					const versionPathParts = pathParts.with(0, versionRelationField);

					const versionAlias = generateJoinAlias(parentCollection, versionPathParts, relationType, parentFields);
					const versionAliasKey = parentFields ? `${parentFields}.${versionRelationField}` : versionRelationField;

					aliasMap[versionAliasKey] = { alias: versionAlias, collection: versionCollection };

					rootQuery.leftJoin({ [versionAlias]: versionCollection }, (joinClause) => {
						joinClause
							.onVal(
								`${versionAlias}.${toVersionedRelationName(relation.meta!.one_collection_field!)}`,
								'=',
								parentCollection,
							)
							.andOn(
								`${versionAlias}.${toVersionedRelationName(relation.field)}`,
								'=',
								knex.raw(
									getHelpers(knex).schema.castA2oPrimaryKey(),
									`${aliasedParentCollection}.${schema.collections[parentCollection]!.primary}`,
								),
							);
					});
				}

				hasMultiRelational = true;
				isJoinAdded = true;
			} else if (relationType === 'o2m') {
				rootQuery.leftJoin(
					{ [alias]: relation.collection },
					`${aliasedParentCollection}.${schema.collections[relation.related_collection!]!.primary}`,
					`${alias}.${relation.field}`,
				);

				aliasMap[aliasKey]!.collection = relation.collection;

				/**
				 * When the current collection is a version table and the O2M child collection is versioned,
				 * an extra join is added to query the versioned child collection.
				 * This ensures a single query can return results if either the main record or its version matches the filter.
				 */
				if (isVersionedCollection(parentCollection) && schema.collections[relation.collection]?.versioning) {
					const versionRelationField = toVersionedRelationName(pathParts[0]!);
					const versionCollection = toVersionedCollectionName(relation.collection);
					const versionPathParts = pathParts.with(0, versionRelationField);

					const versionAlias = generateJoinAlias(parentCollection, versionPathParts, relationType, parentFields);
					const versionAliasKey = parentFields ? `${parentFields}.${versionRelationField}` : versionRelationField;

					aliasMap[versionAliasKey] = { alias: versionAlias, collection: versionCollection };

					rootQuery.leftJoin(
						{ [versionAlias]: versionCollection },
						`${aliasedParentCollection}.${schema.collections[versionCollection]!.primary}`,
						`${versionAlias}.${toVersionedRelationName(relation.field)}`,
					);
				}

				hasMultiRelational = true;
				isJoinAdded = true;
			}
		}

		let parent: string;

		if (relationType === 'm2o') {
			parent = relation.related_collection!;
		} else if (relationType === 'a2o') {
			const pathScope = pathParts[0]!.split(':')[1];

			if (!pathScope) {
				throw new InvalidQueryError({
					reason: `You have to provide a collection scope when sorting or filtering on a many-to-any item`,
				});
			}

			parent = pathScope;
		} else {
			parent = relation.collection;
		}

		if (pathParts.length > 1) {
			followRelation(pathParts.slice(1), parent, `${parentFields ? parentFields + '.' : ''}${pathParts[0]}`);
		}
	}
}
