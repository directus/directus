export interface DirectusError<T = void> extends Error {
	extensions: T;
	code: string;
	status: number;
}

export interface DirectusErrorConstructor<T = void> {
	new (extensions: T, options?: ErrorOptions): DirectusError<T>;
	readonly prototype: DirectusError<T>;
}

export const createError = <T = void>(
	code: string,
	message: string | ((extensions: T) => string),
	status = 500
): DirectusErrorConstructor<T> => {
	return class extends Error implements DirectusError<T> {
		override name = 'DirectusError';
		extensions: T;
		code = code.toUpperCase();
		status = status;

		constructor(extensions: T, options?: ErrorOptions) {
			const msg = typeof message === 'string' ? message : message(extensions as T);

			super(msg, options);

			this.extensions = extensions;
		}

		override toString() {
			return `${this.name} [${this.code}]: ${this.message}`;
		}
	};
};
