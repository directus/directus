import { formatItemsCountPaginated, type FormatItemsCountPaginatedOptions } from '@/utils/format-items-count';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

export function useFormatItemsCountPaginated(options: Omit<FormatItemsCountPaginatedOptions, 'i18n'>) {
	const i18n = useI18n();
	return computed(() => formatItemsCountPaginated({ ...options, i18n }));
}
