import { $ZodError } from 'zod/v4/core';
import type { DirectusError, DirectusErrorConstructor } from './create-error.js';
import { formatZodError } from './format-zod-error.js';

/** Any validation error produced by Zod 4 (classic or mini) */
export type AnyZodError = $ZodError;

export interface ZodAwareErrorConstructor<Extensions extends { reason: string }>
	extends DirectusErrorConstructor<Extensions> {
	new (extensions: Extensions | AnyZodError, options?: ErrorOptions): DirectusError<Extensions>;
}

const isZodError = (value: unknown): value is AnyZodError => value instanceof $ZodError;

/**
 * Allow a reason-based error to be constructed directly from a Zod error.
 * The Zod error is formatted into the `reason` extension and kept as the error's `cause`.
 */
export const withZodSupport = <Extensions extends { reason: string }>(
	Base: DirectusErrorConstructor<Extensions>,
): ZodAwareErrorConstructor<Extensions> =>
	class extends Base {
		constructor(extensions: Extensions | AnyZodError, options?: ErrorOptions) {
			if (isZodError(extensions)) {
				const reason = formatZodError(extensions);
				super({ reason } as Extensions, { cause: extensions, ...options });
			} else {
				super(extensions, options);
			}
		}
	};
