import type { Field, RawField } from '@directus/types';
import type { FieldNode } from 'graphql';
import { cloneDeep } from 'lodash-es';
import type { FunctionFieldNode, NestedCollectionNode } from '../../types/ast.js';
import { getShadowName } from './get-shadow-name.js';

export function buildShadowNode(node: NestedCollectionNode | FieldNode | FunctionFieldNode) {
	const nodeCopy = cloneDeep(node);

	if ('type' in nodeCopy && nodeCopy.type === 'm2o') {
		if (nodeCopy.name) {
			nodeCopy.name = getShadowName(nodeCopy.name, 'collection');
		}

		if (nodeCopy.fieldKey) {
			nodeCopy.fieldKey = getShadowName(nodeCopy.fieldKey, 'field');
		}

		if (nodeCopy.relation.field) {
			nodeCopy.relation.field = getShadowName(nodeCopy.relation.field, 'field');
		}

		if (nodeCopy.relation.related_collection) {
			nodeCopy.relation.related_collection = getShadowName(nodeCopy.relation.related_collection, 'collection');
		}
	}

	return nodeCopy;
}
