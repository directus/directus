import { useI18n } from 'vue-i18n';

export type FormatItemsCountPaginatedOptions = {
	currentItems: number;
	currentPage: number;
	perPage: number;
	isFiltered?: boolean;
	totalItems?: number;
};

export function formatItemsCountPaginated({
	currentItems,
	currentPage,
	perPage,
	isFiltered,
	totalItems,
}: FormatItemsCountPaginatedOptions) {
	const { t, n } = useI18n();

	const values = {
		start: n((currentPage - 1) * perPage + 1),
		end: n(Math.min(currentPage * perPage, currentItems)),
		count: n(currentItems),
	};

	// If filter is active and has effect on items
	if (isFiltered && (totalItems === undefined || currentItems < totalItems)) {
		if (currentItems <= perPage) return t('filtered_item_count', values, currentItems);

		return t('start_end_of_count_filtered_items', values);
	}

	if (currentItems > perPage) return t('start_end_of_count_items', values);

	return t('item_count', values, currentItems);
}

export type FormatItemsCountRelativeOptions = {
	totalItems: number;
	currentItems: number;
	isFiltered?: boolean;
};

export function formatItemsCountRelative({
	totalItems,
	currentItems,
	isFiltered = false,
}: FormatItemsCountRelativeOptions) {
	const { t, n } = useI18n();

	const values = {
		count: n(currentItems),
		total: n(totalItems),
	};

	// If filter is active and has effect on items
	if (isFiltered && currentItems < totalItems) return t('filtered_item_count', values, currentItems);

	if (values.total > values.count) return t('count_of_total_items', values);

	return t('item_count', values, totalItems);
}
