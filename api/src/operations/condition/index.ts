import { defineOperationApi } from '@directus/extensions';
import type { Filter } from '@directus/types';
import { validatePayload } from '@directus/utils';
import { FailedValidationError, joiValidationErrorItemToErrorExtensions } from '@directus/validation';

type Options = {
	filter: Filter;
};

export default defineOperationApi<Options>({
	id: 'condition',

	handler: ({ filter }, { data }) => {
		const errors = validatePayload(filter, data, { requireAll: true });

		if (errors.length > 0) {
			// sanitize and format errors
			const validationErrors = errors
				.map((error) =>
					error.details.map((details) => new FailedValidationError(joiValidationErrorItemToErrorExtensions(details))),
				)
				.flat();

			throw validationErrors;
		} else {
			return null;
		}
	},
});
