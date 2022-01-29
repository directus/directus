import { Filter } from '@directus/shared/types';
import { defineOperationApi, validatePayload } from '@directus/shared/utils';

type Options = {
	filter: Filter;
};

export default defineOperationApi<Options>({
	id: 'auth',

	handler: ({ filter }, { accountability }) => {
		const errors = validatePayload(filter, accountability ?? {});

		if (errors.length > 0) {
			throw errors;
		} else {
			return null;
		}
	},
});
