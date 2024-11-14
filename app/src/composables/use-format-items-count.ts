import { formatItemsCountPaginated, type FormatItemsCountPaginatedOptions } from '@/utils/format-items-count';
import { mapValues } from 'lodash';
import { computed, type ToRefs, unref } from 'vue';
import { useI18n } from 'vue-i18n';

type OptionsWithoutI18n = Omit<FormatItemsCountPaginatedOptions, 'i18n'>;

export function useFormatItemsCountPaginated(options: ToRefs<OptionsWithoutI18n>) {
	const i18n = useI18n();
	return computed(() =>
		formatItemsCountPaginated({ ...(mapValues(options, unref) as unknown as OptionsWithoutI18n), i18n }),
	);
}
