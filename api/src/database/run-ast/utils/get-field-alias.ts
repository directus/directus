import type { FieldNode, FunctionFieldNode, M2ONode, O2MNode } from '../../../types/index.js';
import { applyFunctionToColumnName } from '../../../utils/apply-function-to-column-name.js';

export function getNodeAlias(node: FieldNode | FunctionFieldNode | M2ONode | O2MNode) {
	return applyFunctionToColumnName(node.fieldKey);
}
