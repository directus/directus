import type { DirectusExtensionsError } from '@directus/types';

export interface DirectusErrorConstructor<Extensions = void> {
	new (extensions: Extensions, options?: ErrorOptions): DirectusExtensionsError<Extensions>;
	readonly prototype: DirectusExtensionsError<Extensions>;
}

export const createError = <Extensions = void>(
	code: string,
	message: string | ((extensions: Extensions) => string),
	status = 500,
): DirectusErrorConstructor<Extensions> => {
	return class extends Error implements DirectusExtensionsError<Extensions> {
		override name = 'DirectusError';
		extensions: Extensions;
		code = code.toUpperCase();
		status = status;

		constructor(extensions: Extensions, options?: ErrorOptions) {
			const msg = typeof message === 'string' ? message : message(extensions as Extensions);

			super(msg, options);

			this.extensions = extensions;
		}

		override toString() {
			return `${this.name} [${this.code}]: ${this.message}`;
		}
	};
};
