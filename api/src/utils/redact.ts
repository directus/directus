import type { UnknownObject } from '@directus/types';
import { isObject } from '@directus/utils';

type Paths = string[][];

/**
 * Redact values at certain paths in an object.
 * @param input Input object in which values should be redacted.
 * @param paths Nested array of object paths to be redacted (supports `*` for shallow matching, `**` for deep matching).
 * @param replacement Replacement the values are redacted by.
 * @param valuesToRedact String values that should be redacted.
 * @returns Redacted object.
 */
export function redact(
	input: UnknownObject,
	paths: Paths,
	replacement: string,
	valuesToRedact?: string[]
): UnknownObject {
	const wildcardChars = ['*', '**'];

	const clone = JSON.parse(JSON.stringify(input, getReplacerFn(replacement, valuesToRedact)));
	const visited = new WeakSet<UnknownObject>();
	traverse(clone, paths);

	return clone;

	function traverse(object: UnknownObject, checkPaths: Paths): void {
		if (checkPaths.length === 0) {
			return;
		}

		visited.add(object);

		const globalCheckPaths = [];

		for (const key of Object.keys(object)) {
			const localCheckPaths = [];

			for (const [index, path] of [...checkPaths].entries()) {
				const [current, ...remaining] = path;

				const escapedKey = wildcardChars.includes(key) ? `\\${key}` : key;

				switch (current) {
					case escapedKey:
						if (remaining.length > 0) {
							localCheckPaths.push(remaining);
						} else {
							object[key] = replacement;
							checkPaths.splice(index, 1);
						}

						break;
					case '*':
						if (remaining.length > 0) {
							globalCheckPaths.push(remaining);
							checkPaths.splice(index, 1);
						} else {
							object[key] = replacement;
						}

						break;
					case '**':
						if (remaining.length > 0) {
							const [next, ...nextRemaining] = remaining;

							if (next === escapedKey) {
								if (nextRemaining.length === 0) {
									object[key] = replacement;
								} else {
									localCheckPaths.push(nextRemaining);
								}
							} else if (next !== undefined && wildcardChars.includes(next)) {
								localCheckPaths.push(remaining);
							} else {
								localCheckPaths.push(path);
							}
						} else {
							object[key] = replacement;
						}

						break;
				}
			}

			const value = object[key];

			if (isObject(value) && !visited.has(value)) {
				traverse(value, [...globalCheckPaths, ...localCheckPaths]);
			}
		}
	}
}

/**
 * Replace values and extract Error objects for use with JSON.stringify()
 */
export function getReplacerFn(replacement: string, valuesToRedact?: string[]) {
	const lowercasedValuesToRedact = valuesToRedact?.filter(v => typeof v === "string").map((v) => v.toLowerCase());

	return (_key: string, value: unknown) => {
		if (value instanceof Error) {
			return {
				name: value.name,
				message: value.message,
				stack: value.stack,
				cause: value.cause,
			};
		}

		if (lowercasedValuesToRedact && typeof value === 'string') {
			let redactedValue = value;

			for (const valueToRedact of lowercasedValuesToRedact) {
				if (redactedValue.toLowerCase().includes(valueToRedact)) {
					redactedValue = redactedValue.replace(new RegExp(valueToRedact, 'gi'), replacement);
				}
			}

			return redactedValue;
		}

		return value;
	};
}
