import api from '@/api';
import { unexpectedError } from '@/utils/unexpected-error';
import { getEndpoint } from '@directus/utils';
import { ComputedRef, ref, watchEffect } from 'vue';

export function useFetchTemplateData(
	collection: string,
	primaryKey: ComputedRef<string | number | null>,
	fields: ComputedRef<string[]>,
) {
	const data = ref<Record<string, any>>({});
	const error = ref<Error | null>(null);

	watchEffect(async () => {
		if (!primaryKey.value || primaryKey.value === '+' || fields.value.length === 0) {
			data.value = {};
			return;
		}

		error.value = null;

		try {
			const response = await api.get(`${getEndpoint(collection)}/${primaryKey.value}`, {
				params: { fields: fields.value },
			});

			data.value = response.data.data;
		} catch (err) {
			error.value = err as Error;
			unexpectedError(err);
			data.value = {};
		}
	});

	return { data, error };
}
