import { Filter } from '@directus/shared/types';
import { defineOperationApi, validatePayload } from '@directus/shared/utils';

type Options = {
	filter: Filter;
};

export default defineOperationApi<Options>({
	id: 'condition',

	handler: ({ filter }, { data }) => {
		const errors = validatePayload(filter, data);

		if (errors.length > 0) {
			throw errors;
		} else {
			return null;
		}
	},
});
