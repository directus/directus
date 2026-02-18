import type { Field, RawField } from '@directus/types';
import type { FieldNode } from 'graphql';
import { cloneDeep } from 'lodash-es';
import type { FunctionFieldNode, NestedCollectionNode } from '../../types/ast.js';
import { getShadowName } from './get-shadow-name.js';
import { isShadow } from './is-shadow.js';

export function buildShadowNode(node: NestedCollectionNode | FieldNode | FunctionFieldNode) {
	const nodeCopy = cloneDeep(node);

	if (nodeCopy.type === 'm2o') {
		if (nodeCopy.name) {
			nodeCopy.name = getShadowName(node.name, 'collection');
		}

		if (nodeCopy.fieldKey) {
			nodeCopy.fieldKey = getShadowName(node.fieldKey, 'field');
		}

		if (nodeCopy.relation.field) {
			nodeCopy.relation.field = getShadowName(node.relation.field, 'field');
		}

		if (nodeCopy.relation.related_collection) {
			nodeCopy.relation.related_collection = getShadowName(node.relation.related_collection, 'collection');
		}
	}

	return nodeCopy;
}
