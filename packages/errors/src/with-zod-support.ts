import { ZodError } from 'zod';
import type { DirectusError, DirectusErrorConstructor } from './create-error.js';
import { formatZodError } from './format-zod-error.js';

export interface ZodAwareErrorConstructor<Extensions extends { reason: string }>
	extends DirectusErrorConstructor<Extensions> {
	new (extensions: Extensions | ZodError, options?: ErrorOptions): DirectusError<Extensions>;
}

/**
 * Allow a reason-based error to be constructed directly from a Zod error.
 * The Zod error is formatted into the `reason` extension and kept as the error's `cause`.
 * Only errors whose extensions require nothing but `reason` are supported.
 */
export const withZodSupport = <Extensions extends { reason: string }>(
	Base: DirectusErrorConstructor<Extensions> & ({ reason: string } extends Extensions ? unknown : never),
): ZodAwareErrorConstructor<Extensions> =>
	class extends Base {
		constructor(extensions: Extensions | ZodError, options?: ErrorOptions) {
			if (extensions instanceof ZodError) {
				const reason = formatZodError(extensions);
				super({ reason } as Extensions, { ...options, cause: options?.cause ?? extensions });
			} else {
				super(extensions, options);
			}
		}
	};
