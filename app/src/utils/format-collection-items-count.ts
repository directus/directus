import { useI18n } from 'vue-i18n';

export function formatCollectionItemsCount(
	totalItems: number,
	currentPage: number,
	perPage: number,
	isFiltered = false
) {
	const { t, n } = useI18n();

	const opts = {
		start: n((+currentPage - 1) * perPage + 1),
		end: n(Math.min(currentPage * perPage, totalItems || 0)),
		count: n(totalItems || 0),
	};

	if (isFiltered) {
		if (totalItems === 1) {
			return t('one_filtered_item');
		}

		return t('start_end_of_count_filtered_items', opts);
	}

	if (totalItems > perPage) {
		return t('start_end_of_count_items', opts);
	}

	return t('item_count', { count: totalItems });
}
