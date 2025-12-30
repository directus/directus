import { applyFunctionToColumnName } from './apply-function-to-column-name.js';
import type { FieldNode, FunctionFieldNode, M2ONode, O2MNode } from '../../../types/index.js';

export function getNodeAlias(node: FieldNode | FunctionFieldNode | M2ONode | O2MNode) {
	if ('alias' in node && node.alias === true) return node.fieldKey;
	return applyFunctionToColumnName(node.fieldKey);
}
