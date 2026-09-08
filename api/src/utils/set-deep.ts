import { toPath } from 'lodash-es';

/**
 * Set `value` at `path` in `root`, creating any missing intermediate node as a null-prototype own
 * object.
 *
 * Unlike lodash `set`, this never reads or follows an inherited property while walking the path: a
 * segment is reused only when it is an *own* object property of the current node, and otherwise a
 * fresh null-prototype object is installed. Nodes and the final value are written with
 * `Object.defineProperty`, so a segment named `__proto__` becomes an own data property instead of
 * reparenting the node through the `__proto__` setter.
 *
 * Both guarantees hold regardless of what the caller passes in, so an intermediate node that does
 * have a real prototype (e.g. a plain object produced by `merge({}, …)`) is still safe: a
 * user-controlled segment named like a builtin (`toString`, `__proto__`, `constructor`, …) becomes
 * a plain own key and can never reach or corrupt a shared prototype — the prototype-pollution
 * vector behind GHSA-gwvv-rr68-cmv6.
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

		if (Object.hasOwn(node, key) === false || typeof node[key] !== 'object' || node[key] === null) {
			define(node, key, Object.create(null));
		}

		node = node[key];
	}

	define(node, segments[segments.length - 1]!, value);

	return root;
}

/** Write `value` as an own data property, bypassing any inherited setter such as `__proto__` */
function define(node: Record<string, any>, key: string, value: unknown): void {
	Object.defineProperty(node, key, { value, writable: true, enumerable: true, configurable: true });
}
