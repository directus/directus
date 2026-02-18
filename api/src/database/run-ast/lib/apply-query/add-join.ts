import { InvalidQueryError } from '@directus/errors';
import type { SchemaOverview } from '@directus/types';
import { getRelationInfo } from '@directus/utils';
import type { Knex } from 'knex';
import { clone } from 'lodash-es';
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
	raw?: boolean;
};

export function addJoin({ path, collection, aliasMap, rootQuery, schema, knex, raw }: AddJoinProps) {
	let hasMultiRelational = false;
	let isJoinAdded = false;
	// TODO: Make dynamic
	raw = false;

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
				rootQuery.leftJoin({ [alias]: `directus_versions_${relation.related_collection!}` }, function (joinClause) {
					joinClause.on(
						`${aliasedParentCollection}.${relation.field}`,
						'=',
						`${alias}.${schema.collections[relation.related_collection!]!.primary}`,
					);

					// inject shadow field for m2o relations to be able to apply filters on the relation field even if it's hidden
					if (raw === false) {
						const shadowField = `directus_${relation.field}`;

						if (schema.collections[parentCollection]?.fields[shadowField]) {
							joinClause.orOn(
								`${aliasedParentCollection}.${shadowField}`,
								'=',
								`${alias}.${schema.collections[relation.related_collection!]!.primary}`,
							);
						}
					}
				});

				aliasMap[aliasKey]!.collection = relation.related_collection!;

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

				hasMultiRelational = true;
				isJoinAdded = true;
			} else if (relationType === 'o2m') {
				rootQuery.leftJoin(
					{ [alias]: relation.collection },
					`${aliasedParentCollection}.${schema.collections[relation.related_collection!]!.primary}`,
					`${alias}.${relation.field}`,
				);

				aliasMap[aliasKey]!.collection = relation.collection;

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
