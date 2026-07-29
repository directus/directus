import { toPath } from 'lodash-es';

/**
 * Set `value` at `path` in `root`, creating any missing intermediate node as a null-prototype own
 * object.
 *
 * Unlike lodash `set`, this never reads or follows an inherited property while walking the path: it
 * reuses a segment only when it is already an own object, and otherwise creates a fresh
 * null-prototype object. A user-controlled segment named like a builtin (`toString`, `__proto__`,
 * `constructor`, …) therefore becomes a plain own key and can never reach or corrupt a shared
 * prototype — the prototype-pollution vector behind GHSA-gwvv-rr68-cmv6.
 */
export function setDeep(
	root: Record<string, any>,
	path: string | Array<string | number>,
	value: unknown,
): Record<string, any> {
	const segments = (Array.isArray(path) ? path.map(String) : toPath(path)) as string[];

	if (segments.length === 0) return root;

	let node: Record<string, any> = root;

	for (let i = 0; i < segments.length - 1; i += 1) {
		const key = segments[i]!;

		if (typeof node[key] !== 'object' || node[key] === null) {
			node[key] = Object.create(null);
		}

		node = node[key];
	}

	node[segments[segments.length - 1]!] = value;

	return root;
}
