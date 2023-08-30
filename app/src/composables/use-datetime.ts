import { localizedFormat } from '@/utils/localized-format';
import { localizedFormatDistance } from '@/utils/localized-format-distance';
import { localizedFormatDistanceStrict } from '@/utils/localized-format-distance-strict';
import { parse, parseISO } from 'date-fns';
import { MaybeRef, computed, isRef, onMounted, onUnmounted, ref, unref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

export type DatetimeType = 'dateTime' | 'date' | 'time' | 'timestamp';

export interface DatetimeOptions {
	format?: string;
	relative?: boolean;
	strict?: boolean;
	round?: 'floor' | 'round' | 'ceil';
	suffix?: boolean;
}

let refreshInterval: number | null = null;
const refresher = ref(0);

export function useDatetime(type: DatetimeType, options: DatetimeOptions) {
	const optionsWithDefaults: Required<DatetimeOptions> = {
		format: 'long',
		relative: false,
		strict: false,
		round: 'round',
		suffix: true,
		...options,
	};

	const { t } = useI18n();

	function formatter(value: MaybeRef<string>, refresher?: MaybeRef<number>) {
		const displayValue = ref<string | null>(null);

		const localValue = computed(() => {
			const _value = unref(value);
			if (!_value) return null;

			if (type === 'timestamp') {
				return parseISO(_value);
			} else if (type === 'dateTime') {
				return parse(_value, "yyyy-MM-dd'T'HH:mm:ss", new Date());
			} else if (type === 'date') {
				return parse(_value, 'yyyy-MM-dd', new Date());
			} else if (type === 'time') {
				return parse(_value, 'HH:mm:ss', new Date());
			}

			return null;
		});

		watch(
			localValue,
			(newValue) => {
				if (newValue === null) {
					displayValue.value = null;
					return;
				}

				if (optionsWithDefaults.relative) {
					displayValue.value = relativeFormat(newValue);
				} else {
					let format;

					if (optionsWithDefaults.format === 'long') {
						format = `${t('date-fns_date')} ${t('date-fns_time')}`;
						if (type === 'date') format = String(t('date-fns_date'));
						if (type === 'time') format = String(t('date-fns_time'));
					} else if (optionsWithDefaults.format === 'short') {
						format = `${t('date-fns_date_short')} ${t('date-fns_time_short')}`;
						if (type === 'date') format = String(t('date-fns_date_short'));
						if (type === 'time') format = String(t('date-fns_time_short'));
					} else {
						format = optionsWithDefaults.format;
					}

					displayValue.value = localizedFormat(newValue, format);
				}
			},
			{ immediate: true }
		);

		if (optionsWithDefaults.relative && isRef(refresher)) {
			watch(refresher, () => {
				if (!localValue.value) return;
				displayValue.value = relativeFormat(localValue.value);
			});
		}

		return displayValue;
	}

	const relativeFormat = (value: Date) => {
		if (optionsWithDefaults.strict) {
			return localizedFormatDistanceStrict(value, new Date(), {
				addSuffix: optionsWithDefaults.suffix,
				roundingMethod: optionsWithDefaults.round,
			});
		} else {
			return localizedFormatDistance(value, new Date(), {
				addSuffix: optionsWithDefaults.suffix,
			});
		}
	};

	onMounted(() => {
		if (!optionsWithDefaults.relative || refreshInterval) return;

		refreshInterval = window.setInterval(() => {
			refresher.value++;
		}, 60000);
	});

	onUnmounted(() => {
		if (refreshInterval) {
			clearInterval(refreshInterval);
			refreshInterval = null;
		}

		refresher.value = 0;
	});

	return { formatter, refresher };
}
