import { renderFn, get, Scope } from 'micromustache';

type Mustacheable = string | number | boolean | null | Mustacheable[] | { [key: string]: Mustacheable };
type GenericString<T> = T extends string ? string : T;

function resolveFn(path: string, scope?: Scope): unknown {
	if (!scope) return undefined;

	const value = get(scope, path);

	return typeof value === 'object' ? JSON.stringify(value) : value;
}

export function renderMustache<T extends Mustacheable>(item: T, scope: Scope): GenericString<T> {
	if (typeof item === 'string') {
		return renderFn(item, resolveFn, scope, { explicit: true }) as GenericString<T>;
	} else if (Array.isArray(item)) {
		return item.map((element) => renderMustache(element, scope)) as GenericString<T>;
	} else if (typeof item === 'object' && item !== null) {
		return Object.fromEntries(
			Object.entries(item).map(([key, value]) => [key, renderMustache(value, scope)])
		) as GenericString<T>;
	} else {
		return item as GenericString<T>;
	}
}
