import type { FieldNode, FunctionFieldNode, NestedCollectionNode } from '../../types/index.js';
import { parseFilterKey } from '../../utils/parse-filter-key.js';

/**
 * Derive the unaliased field key from the given AST node.
 */
export function getUnaliasedFieldKey(node: NestedCollectionNode | FieldNode | FunctionFieldNode) {
	switch (node.type) {
		case 'o2m':
			return node.relation.meta!.one_field!;
		case 'a2o':
		case 'm2o':
			return node.relation.field;
		case 'field':
		case 'functionField':
			// The field name might still include a function, so process that here as well
			return parseFilterKey(node.name).fieldName;
	}
}
