import { createError, InternalServerError } from '@directus/errors';
import { defineOperationApi } from '@directus/extensions';

type Options = {
	code: string;
	status: string;
	message: string;
};

const FALLBACK_ERROR = new InternalServerError();

export default defineOperationApi<Options>({
	id: 'throw-error',

	handler: ({ code, status, message }) => {
		const statusCode = parseInt(status);

		const error = createError(
			code ?? FALLBACK_ERROR.code,
			message ?? FALLBACK_ERROR.message,
			isNaN(statusCode) ? FALLBACK_ERROR.status : statusCode,
		);

		throw new error();
	},
});
