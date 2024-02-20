import type { AbstractSqlQueryTargetNode } from '@directus/data-sql';

/**
 * Used to convert a JSON target across all condition nodes
 *
 * @param targetNode - any target node
 * @param target the table and column index combination
 * @returns the json props appended to the target using the arrow syntax if a json node was given
 */
export function applyJsonPathIfNeeded(targetNode: AbstractSqlQueryTargetNode, target: string): string {
	if (targetNode.type !== 'json') return target;
	let path = '';

	targetNode.path.forEach((p, idx) => {
		const isLastItem = idx === targetNode.path.length - 1;
		const arrow = isLastItem ? '->>' : '->';
		path += ` ${arrow} $${p + 1}`;
	});

	return target + path;
}
