export const createError = <T = void>(code: string, message: string | ((extensions: T) => string), status = 500) => {
	class DirectusError extends Error {
		override name = 'DirectusError';
		extensions?: T;
		code = code.toUpperCase();
		status = status;

		constructor(
			...[extensions, options]: T extends void
				? [extensions?: T, options?: ErrorOptions]
				: [extensions: T, options?: ErrorOptions]
		) {
			const msg = typeof message === 'string' ? message : message(extensions as T);

			super(msg, options);

			if (extensions) {
				this.extensions = extensions;
			}
		}

		override toString() {
			return `${this.name} [${this.code}]: ${this.message}`;
		}
	}

	return DirectusError;
};
