import type { ZodError as ZodV3Error } from 'zod/v3';
import type { $ZodError } from 'zod/v4/core';
import { fromZodError, isZodErrorLike } from 'zod-validation-error';
import type { DirectusError, DirectusErrorConstructor } from './create-error.js';

/** Any validation error produced by Zod 4 (classic or mini) or Zod 3 */
export type AnyZodError = $ZodError | ZodV3Error;

export interface ZodAwareErrorConstructor<Extensions extends { reason: string }>
	extends DirectusErrorConstructor<Extensions> {
	new (extensions: Extensions | AnyZodError, options?: ErrorOptions): DirectusError<Extensions>;
}

const isZodError = (value: unknown): value is AnyZodError => value instanceof Error && isZodErrorLike(value);

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
				// fromZodError is only typed for Zod 4, but formats Zod 3 issues the same way at runtime
				const reason = fromZodError(extensions as $ZodError).message;
				super({ reason } as Extensions, { cause: extensions, ...options });
			} else {
				super(extensions, options);
			}
		}
	};
