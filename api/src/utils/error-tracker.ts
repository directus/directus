import { useEnv } from '@directus/env';
import { createError, ErrorCode } from '@directus/errors';
import type { DirectusError } from '@directus/types';
import type { ImportRowLines, ImportRowRange } from '@directus/validation';

const env = useEnv();

const MAX_IMPORT_ERRORS = env['MAX_IMPORT_ERRORS'] as number;

type CapturedErrorData = {
	message: string;
	rowNumbers: number[];
};

export function createErrorTracker() {
	let genericError: DirectusError | undefined;
	// For errors with field / type (joi validation or DB with field)
	const fieldErrors: Map<ErrorCode, Map<string, CapturedErrorData>> = new Map();
	let capturedErrorCount = 0;
	let isLimitReached = false;

	function convertToRanges(rows: number[], minRangeSize = 4): Array<ImportRowLines | ImportRowRange> {
		const sorted = Array.from(new Set(rows)).sort((a, b) => a - b);
		const result: Array<ImportRowLines | ImportRowRange> = [];

		if (sorted.length === 0) return [];

		let start = sorted[0] as number;
		let prev = sorted[0] as number;
		let count = 1;
		const nonConsecutive: number[] = [];

		const flush = () => {
			if (count >= minRangeSize) {
				result.push({ type: 'range', start, end: prev });
			} else {
				for (let i = start; i <= prev; i++) {
					nonConsecutive.push(i);
				}
			}
		};

		for (let i = 1; i < sorted.length; i++) {
			const current = sorted[i] as number;

			if (current === prev + 1) {
				prev = current;
				count++;
			} else {
				flush();
				start = prev = current;
				count = 1;
			}
		}

		flush();

		// Add non-consecutive rows as a single "lines" entry
		if (nonConsecutive.length > 0) {
			result.push({ type: 'lines', rows: nonConsecutive });
		}

		return result;
	}

	function addCapturedError(err: any, rowNumber: number) {
		const field = err.extensions?.field;

		if (field) {
			const type = err.extensions?.type;
			const substring = err.extensions?.substring;
			const valid = err.extensions?.valid;
			const invalid = err.extensions?.invalid;
			let key = type ? `${field}|${type}` : field;

			if (substring !== undefined) key += `|substring:${substring}`;
			if (valid !== undefined) key += `|valid:${JSON.stringify(valid)}`;
			if (invalid !== undefined) key += `|invalid:${JSON.stringify(invalid)}`;

			if (!fieldErrors.has(err.code)) {
				fieldErrors.set(err.code, new Map());
			}

			const errorsByCode = fieldErrors.get(err.code)!;

			if (!errorsByCode.has(key)) {
				errorsByCode.set(key, {
					message: err.message,
					rowNumbers: [],
				});
			}

			errorsByCode.get(key)!.rowNumbers.push(rowNumber);
		} else {
			genericError = err;
		}

		capturedErrorCount++;

		if (capturedErrorCount >= MAX_IMPORT_ERRORS) {
			isLimitReached = true;
		}
	}

	function hasGenericError() {
		return genericError !== undefined;
	}

	function buildFinalErrors() {
		if (genericError) {
			return [genericError];
		}

		return Array.from(fieldErrors.entries()).flatMap(([code, fieldMap]) =>
			Array.from(fieldMap.entries()).map(([compositeKey, errorData]) => {
				const parts = compositeKey.split('|');
				const field = parts[0];
				const type = parts[1];

				const extensions: any = {};

				for (let i = 2; i < parts.length; i++) {
					const [paramType, paramValue] = parts[i]?.split(':', 2) ?? [];
					if (!paramType || paramValue === undefined) continue;

					try {
						extensions[paramType] = JSON.parse(paramValue);
					} catch {
						extensions[paramType] = paramValue;
					}
				}

				const ErrorClass = createError<any>(code, errorData.message, 400);
				return new ErrorClass({
					field,
					type,
					...extensions,
					rows: convertToRanges(errorData.rowNumbers),
				});
			}),
		);
	}

	return {
		addCapturedError,
		buildFinalErrors,
		getCount: () => capturedErrorCount,
		hasErrors: () => capturedErrorCount > 0 || hasGenericError(),
		shouldStop: () => isLimitReached || hasGenericError(),
		hasGenericError,
	};
}
