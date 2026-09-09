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

		// `Object.hasOwn` is what keeps the guarantee above true. A plain read of
		// `node[key]` for a segment named `__proto__` returns the *inherited*
		// prototype, which is an object, so the type check alone would reuse it and
		// the rest of the walk would run on a shared prototype. That is unreachable
		// only while every node on the path is null-prototype; a caller that hands us
		// a node built with a plain `merge` — the GraphQL query parser does — breaks
		// that assumption.
		if (!Object.hasOwn(node, key) || typeof node[key] !== 'object' || node[key] === null) {
			assignOwn(node, key, Object.create(null));
		}

		node = node[key];
	}

	assignOwn(node, segments[segments.length - 1]!, value);

	return root;
}

/**
 * Define `key` as an own data property of `obj`, bypassing any inherited setter.
 *
 * Plain assignment is not enough: on an object that still inherits from
 * `Object.prototype`, `obj['__proto__'] = x` invokes the inherited accessor and
 * *reparents* the object instead of creating an own key — so the write silently
 * lands somewhere other than where the path says, and the next read returns
 * `undefined`. `defineProperty` always creates the own key, matching what every
 * other segment name does.
 */
function assignOwn(obj: Record<string, any>, key: string, value: unknown): void {
	Object.defineProperty(obj, key, { value, writable: true, enumerable: true, configurable: true });
}
