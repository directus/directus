import { Filter } from '@directus/shared/types';
import { defineOperationApi, validatePayload } from '@directus/shared/utils';

type Options = {
	filter: Filter;
	item: string;
};

export default defineOperationApi<Options>({
	id: 'validate',

	handler: ({ filter, item }) => {
		const errors = validatePayload(filter, JSON.parse(item));

		if (errors.length > 0) {
			throw errors;
		} else {
			return null;
		}
	},
});
