import { cloneDeep } from 'lodash-es';
import type { FieldNode, FunctionFieldNode, NestedCollectionNode } from '../../types/ast.js';
import { toVersionedCollectionName } from './to-versioned-collection-name.js';
import { toVersionedRelationName } from './to-versioned-relation-name.js';
import { VERSION_SYSTEM_FIELDS } from './version-system-fields.js';

/**
 * Adjusts an AST nodes relevant collection and relation names to their
 * versioned equivalents.
 *
 * @param node - The source AST node to transform.
 * @returns A node with versioned collection/relation names applied.
 */
export function toVersionNode<T extends NestedCollectionNode | FieldNode | FunctionFieldNode>(node: T): T {
	const child = cloneDeep(node);

	if (child.type === 'm2o') {
		child.fieldKey = toVersionedRelationName(child.fieldKey);
		child.name = toVersionedCollectionName(child.name);
		child.relation.related_collection = toVersionedCollectionName(child.relation.related_collection!);
		child.relation.field = toVersionedRelationName(child.relation.field);

		if (child.relation.schema) {
			child.relation.schema.foreign_key_table &&= toVersionedCollectionName(child.relation.schema?.foreign_key_table);
			child.relation.schema.foreign_key_column &&= VERSION_SYSTEM_FIELDS.primary.field;
		}

		if (child.relation.meta) {
			child.relation.meta.many_field &&= toVersionedRelationName(child.relation.meta.many_field);
			child.relation.meta.one_collection &&= toVersionedCollectionName(child.relation.meta.one_collection);
		}
	}

	if (child.type === 'o2m') {
		child.fieldKey = toVersionedRelationName(child.fieldKey);
		child.relation.collection = toVersionedCollectionName(child.relation.collection);
		child.relation.field = toVersionedRelationName(child.relation.field);
	}

	if (child.type === 'a2o') {
		child.fieldKey = toVersionedRelationName(child.fieldKey);
		child.relation.field = toVersionedRelationName(child.relation.field);
		child.relation.meta!.many_collection = toVersionedCollectionName(child.relation.meta!.many_collection!);
		child.relation.meta!.junction_field = toVersionedCollectionName(child.relation.meta!.many_collection!);
	}

	return child;
}
