export interface DirectusError<Extensions = void> extends Error {
	extensions: Extensions;
	code: string;
	status: number;
}

export interface DirectusErrorConstructor<Extensions = void> {
	new (extensions: Extensions, options?: ErrorOptions): DirectusError<Extensions>;
	readonly prototype: DirectusError<Extensions>;
}

export const createError = <Extensions = void>(
	code: string,
	message: string | ((extensions: Extensions) => string),
	status = 500
): DirectusErrorConstructor<Extensions> => {
	return class extends Error implements DirectusError<Extensions> {
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
