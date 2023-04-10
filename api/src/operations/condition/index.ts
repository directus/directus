import type { Filter } from '@directus/types';
import { defineOperationApi, validatePayload } from '@directus/utils';

type Options = {
	filter: Filter;
};

export default defineOperationApi<Options>({
	id: 'condition',

	handler: ({ filter }, { data }) => {
		const errors = validatePayload(filter, data, { requireAll: true });

		if (errors.length > 0) {
			throw errors;
		} else {
			return null;
		}
	},
});
