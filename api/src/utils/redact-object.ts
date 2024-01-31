import type { UnknownObject } from '@directus/types';
import { isObject } from '@directus/utils';

type Keys = string[][];
type Values = Record<string, any>;
type Replacement = (key?: string) => string;

/**
 * Redact values in an object.
 *
 * @param input Input object in which values should be redacted.
 * @param redact The key paths at which and values itself which should be redacted.
 * @param redact.keys Nested array of key paths at which values should be redacted. (Supports `*` for shallow matching, `**` for deep matching.)
 * @param redact.values Value names and the corresponding values that should be redacted.
 * @param replacement Replacement function with which the values are redacted.
 * @returns Redacted object.
 */
export function redactObject(
	input: UnknownObject,
	redact: {
		keys?: Keys;
		values?: Values;
	},
	replacement: Replacement,
): UnknownObject {
	const wildcardChars = ['*', '**'];

	const clone = JSON.parse(JSON.stringify(input, getReplacer(replacement, redact.values)));

	if (redact.keys) {
		traverse(clone, redact.keys);
	}

	return clone;

	function traverse(object: UnknownObject, checkKeyPaths: Keys): void {
		if (checkKeyPaths.length === 0) {
			return;
		}

		const REDACTED_TEXT = replacement();
		const globalCheckPaths = [];

		for (const key of Object.keys(object)) {
			const localCheckPaths = [];

			for (const [index, path] of [...checkKeyPaths].entries()) {
				const [current, ...remaining] = path;

				const escapedKey = wildcardChars.includes(key) ? `\\${key}` : key;

				switch (current) {
					case escapedKey:
						if (remaining.length > 0) {
							localCheckPaths.push(remaining);
						} else {
							object[key] = REDACTED_TEXT;
							checkKeyPaths.splice(index, 1);
						}

						break;
					case '*':
						if (remaining.length > 0) {
							globalCheckPaths.push(remaining);
							checkKeyPaths.splice(index, 1);
						} else {
							object[key] = REDACTED_TEXT;
						}

						break;
					case '**':
						if (remaining.length > 0) {
							const [next, ...nextRemaining] = remaining;

							if (next === escapedKey) {
								if (nextRemaining.length === 0) {
									object[key] = REDACTED_TEXT;
								} else {
									localCheckPaths.push(nextRemaining);
								}
							} else if (next !== undefined && wildcardChars.includes(next)) {
								localCheckPaths.push(remaining);
							} else {
								localCheckPaths.push(path);
							}
						} else {
							object[key] = REDACTED_TEXT;
						}

						break;
				}
			}

			const value = object[key];

			if (isObject(value)) {
				traverse(value, [...globalCheckPaths, ...localCheckPaths]);
			}
		}
	}
}

/**
 * Replace values and extract Error objects for use with JSON.stringify()
 */
export function getReplacer(replacement: Replacement, values?: Values) {
	const filteredValues = values
		? Object.entries(values).filter(([_k, v]) => typeof v === 'string' && v.length > 0)
		: [];

	const replacer = (seen: WeakSet<object>) => {
		return function (_key: string, value: unknown) {
			if (value instanceof Error) {
				return {
					name: value.name,
					message: value.message,
					stack: value.stack,
					cause: value.cause,
				};
			}

			if (value !== null && typeof value === 'object') {
				if (seen.has(value)) {
					return '[Circular]';
				}

				seen.add(value);

				const newValue: any = Array.isArray(value) ? [] : {};

				for (const [key2, value2] of Object.entries(value)) {
					if (typeof value2 === 'string') {
						newValue[key2] = value2;
					} else {
						newValue[key2] = replacer(seen)(key2, value2);
					}
				}

				seen.delete(value);

				return newValue;
			}

			if (!values || filteredValues.length === 0 || typeof value !== 'string') return value;

			let finalValue = value;

			for (const [redactKey, valueToRedact] of filteredValues) {
				if (finalValue.includes(valueToRedact)) {
					finalValue = finalValue.replace(new RegExp(valueToRedact, 'g'), replacement(redactKey));
				}
			}

			return finalValue;
		};
	};

	const seen = new WeakSet();
	return replacer(seen);
}
