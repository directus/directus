import { renderFn, get, Scope } from 'micromustache';
import { parseJSON } from './parse-json';

type Mustacheable = string | number | boolean | null | Mustacheable[] | { [key: string]: Mustacheable };
type GenericString<T> = T extends string ? string : T;

function resolveFn(path: string, scope?: Scope): unknown {
	if (!scope) return undefined;

	const value = get(scope, path);

	return typeof value === 'object' ? JSON.stringify(value) : value;
}

function renderMustache<T extends Mustacheable>(item: T, scope: Scope): GenericString<T> {
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

export function applyOperationOptions(options: Record<string, any>, data: Record<string, any>): Record<string, any> {
	return Object.fromEntries(
		Object.entries(options).map(([key, value]) => {
			if (typeof value === 'string') {
				const single = value.match(/^\{\{\s*([^}\s]+)\s*\}\}$/);

				if (single !== null) {
					return [key, get(data, single[1])];
				}
			}

			return [key, renderMustache(value, data)];
		})
	);
}

export function optionToObject<T>(option: T): Exclude<T, string> {
	return typeof option === 'string' ? parseJSON(option) : option;
}

export function optionToString(option: unknown): string {
	return typeof option === 'object' ? JSON.stringify(option) : String(option);
}
