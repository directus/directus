import type { Relation, SchemaOverview } from '@directus/types';
import { InvalidQueryError } from '@directus/errors';
import { getRelationInfo } from './get-relation-info.js';

export type AliasMap = { [key: string]: { alias: string; collection: string } };

export type ColPathProps = {
	path: string[];
	collection: string;
	aliasMap: AliasMap;
	relations: Relation[];
	schema?: SchemaOverview;
};

export type ColPathResult = {
	columnPath: string;
	targetCollection: string;
	addNestedPkField: string | undefined;
};

/**
 * Converts a Directus field list path to the correct SQL names based on the constructed alias map.
 * For example: ['author', 'role', 'name'] -> 'ljnsv.name'
 * Also returns the target collection of the column: 'directus_roles'
 * If the last filter path is an alias field, a nested PK is appended to the path
 */
export function getColumnPath({ path, collection, aliasMap, relations, schema }: ColPathProps) {
	return followRelation(path);

	function followRelation(
		pathParts: string[],
		parentCollection: string = collection,
		parentFields?: string,
		addNestedPkField?: string,
	): ColPathResult {
		/**
		 * For A2M fields, the path can contain an optional collection scope <field>:<scope>
		 */
		const pathRoot = pathParts[0]!.split(':')[0];
		const { relation, relationType } = getRelationInfo(relations, parentCollection, pathRoot!);

		if (!relation) {
			throw new InvalidQueryError({ reason: `"${parentCollection}.${pathRoot}" is not a relational field` });
		}

		const alias = parentFields ? aliasMap[`${parentFields}.${pathParts[0]}`]?.alias : aliasMap[pathParts[0]!]?.alias;
		const remainingParts = pathParts.slice(1);

		let parent: string;

		if (relationType === 'a2o') {
			const pathScope = pathParts[0]!.split(':')[1];

			if (!pathScope) {
				throw new InvalidQueryError({
					reason: `You have to provide a collection scope when sorting on a many-to-any item`,
				});
			}

			parent = pathScope;
		} else if (relationType === 'm2o') {
			parent = relation.related_collection!;
		} else {
			parent = relation.collection;
		}

		// Top level alias field
		if (schema && !((remainingParts[0] ?? parent).includes('(') && (remainingParts[0] ?? parent).includes(')'))) {
			if (remainingParts.length === 0) {
				remainingParts.push(schema.collections[parent]!.primary);
				addNestedPkField = schema.collections[parent]!.primary;
			}
			// Nested level alias field
			else if (
				remainingParts.length === 1 &&
				schema.collections[parent]!.fields[remainingParts[0]!]!.type === 'alias'
			) {
				remainingParts.push(schema.collections[relation!.related_collection!]!.primary);
				addNestedPkField = schema.collections[relation!.related_collection!]!.primary;
			}
		}

		if (remainingParts.length === 1) {
			return {
				columnPath: `${alias || parent}.${remainingParts[0]}`,
				targetCollection: parent,
				addNestedPkField,
			};
		}

		if (remainingParts.length) {
			return followRelation(
				remainingParts,
				parent,
				`${parentFields ? parentFields + '.' : ''}${pathParts[0]}`,
				addNestedPkField,
			);
		}

		return { columnPath: '', targetCollection: '', addNestedPkField };
	}
}
