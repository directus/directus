import { formatItemsCountPaginated, type FormatItemsCountPaginatedOptions } from '@/utils/format-items-count';
import { mapValues } from 'lodash';
import { computed, type ToRefs, unref } from 'vue';
import { useI18n } from 'vue-i18n';

export function useFormatItemsCountPaginated(options: ToRefs<Omit<FormatItemsCountPaginatedOptions, 'i18n'>>) {
	const i18n = useI18n();
	return computed(() => {
		const opts = mapValues(options, unref);
		return formatItemsCountPaginated({ ...opts, i18n });
	});
}
