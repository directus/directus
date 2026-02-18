import { buildShadowNode } from '../../../../services/shadows/build-shadow-node.js';
import { isShadow } from '../../../../services/shadows/is-shadow.js';
import type { AST, FieldNode, FunctionFieldNode, NestedCollectionNode } from '../../../../types/ast.js';
import { getUnaliasedFieldKey } from '../../../utils/get-unaliased-field-key.js';

export function injectShadow(ast: AST) {
	if (!isShadow(ast.name, 'collection')) {
		return;
	}

	ast.children = processChildren(ast.children);
}

function processChildren(children: (NestedCollectionNode | FieldNode | FunctionFieldNode)[]) {
	for (const child of children) {
		if (child.type === 'm2o') {
			if (isShadow(getUnaliasedFieldKey(child), 'field')) {
				continue;
			}

			child.children.push(buildShadowNode(child));
		}
	}

	return children;
}
