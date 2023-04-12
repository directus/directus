import api from '@/api';
import { cloneDeep, set } from 'lodash';

export const paginate = async <T = unknown>(
	url: Parameters<(typeof api)['get']>[0],
	config: Parameters<(typeof api)['get']>[1] = {},
	pageSize: number,
	max = Infinity
): Promise<T[]> => {
	let page = 1;
	let hasMore = true;

	const result = [] as T[];

	while (result.length < max && hasMore === true) {
		const configWithPagination = cloneDeep(config);
		set(configWithPagination, 'params.page', page);
		set(configWithPagination, 'params.limit', pageSize);

		const { data } = await api.get(url, configWithPagination);

		if (data.length === 0) {
			hasMore = false;
		} else {
			result.push(...data);
		}

		page++;
	}

	if (Number.isFinite(max)) {
		return result.slice(0, max);
	}

	return result;
};
