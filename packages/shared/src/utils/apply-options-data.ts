import { renderFn, get, Scope, ResolveFn } from 'micromustache';
import { parseJSON } from './parse-json';

type Mustacheable = string | number | boolean | null | Mustacheable[] | { [key: string]: Mustacheable };
type GenericString<T> = T extends string ? string : T;

export function applyOptionsData(
	options: Record<string, any>,
	data: Record<string, any>,
	skipUndefinedKeys: string[] = []
): Record<string, any> {
	return Object.fromEntries(
		Object.entries(options).map(([key, value]) => {
			if (typeof value === 'string') {
				const single = value.match(/^\{\{\s*([^}\s]+)\s*\}\}$/);

				if (single !== null && single.length > 0) {
					const foundValue = get(data, single[1]!);

					if (foundValue !== undefined || !skipUndefinedKeys.includes(key)) {
						return [key, foundValue];
					} else {
						return [key, value];
					}
				}
			}

			return [key, renderMustache(value, data, skipUndefinedKeys.includes(key))];
		})
	);
}

function resolveFn(skipUndefined: boolean): ResolveFn {
	return (path: string, scope?: Scope) => {
		if (!scope) return skipUndefined ? `{{${path}}}` : undefined;

		const value = get(scope, path);

		if (value !== undefined || !skipUndefined) {
			return typeof value === 'object' ? JSON.stringify(value) : value;
		} else {
			return `{{${path}}}`;
		}
	};
}

function renderMustache<T extends Mustacheable>(item: T, scope: Scope, skipUndefined: boolean): GenericString<T> {
	if (typeof item === 'string') {
		return renderFn(item, resolveFn(skipUndefined), scope, { explicit: true }) as GenericString<T>;
	} else if (Array.isArray(item)) {
		return item.map((element) => renderMustache(element, scope, skipUndefined)) as GenericString<T>;
	} else if (typeof item === 'object' && item !== null) {
		return Object.fromEntries(
			Object.entries(item).map(([key, value]) => [key, renderMustache(value, scope, skipUndefined)])
		) as GenericString<T>;
	} else {
		return item as GenericString<T>;
	}
}

export function optionToObject<T>(option: T): Exclude<T, string> {
	return typeof option === 'string' ? parseJSON(option) : option;
}

export function optionToString(option: unknown): string {
	return typeof option === 'object' ? JSON.stringify(option) : String(option);
}
