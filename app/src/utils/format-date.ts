import { i18n } from '@/lang';
import { localizedFormat } from '@/utils/localized-format';
import { localizedFormatDistance } from '@/utils/localized-format-distance';
import { localizedFormatDistanceStrict } from '@/utils/localized-format-distance-strict';
import { parseDate } from '@/utils/parse-date';

export interface FormatDateOptions {
	type: 'dateTime' | 'date' | 'time' | 'timestamp';
	/** 'short', 'long' or custom (https://www.unicode.org/reports/tr35/tr35-dates.html#Date_Field_Symbol_Table) */
	format?: string;
	relative?: boolean;
	strict?: boolean;
	round?: 'floor' | 'round' | 'ceil';
	suffix?: boolean;
	includeSeconds?: boolean;
	use24?: boolean;
}

/**
 * Formats a date string using the provided options
 *
 * @param value - The value to format
 * @param options - Configuration object for datetime formating options
 *
 * @example
 * ```js
 * formatDate({ type: 'dateTime', format: 'short', relative: false, strict: false, round: 'round', suffix: false, includeSeconds: false, use24: false });
 * // => "YYYY-MM-DD HH:mm"
 * ```
 */
export function formatDate(value: string, options: FormatDateOptions) {
	if (options.relative) {
		if (options.strict) {
			return localizedFormatDistanceStrict(parseDate(value, options.type), new Date(), {
				addSuffix: options.suffix,
				roundingMethod: options.round,
			});
		} else {
			return localizedFormatDistance(parseDate(value, options.type), new Date(), {
				addSuffix: options.suffix,
			});
		}
	}

	let timeFormat;

	if (options.use24) {
		timeFormat = options.includeSeconds ? 'date-fns_time_24hour' : 'date-fns_time_no_seconds_24hour';
	} else if (options.format === 'short') {
		timeFormat = options.includeSeconds ? 'date-fns_time_short_seconds' : 'date-fns_time_short';
	} else {
		timeFormat = options.includeSeconds ? 'date-fns_time' : 'date-fns_time_no_seconds';
	}

	let format;

	if (options?.format === undefined || options.format === 'long') {
		format = `${i18n.global.t('date-fns_date')} ${i18n.global.t(timeFormat)}`;
		if (options?.type === 'date') format = String(i18n.global.t('date-fns_date'));
		if (options?.type === 'time') format = String(i18n.global.t(timeFormat));
	} else if (options.format === 'short') {
		format = `${i18n.global.t('date-fns_date_short')} ${i18n.global.t(timeFormat)}`;
		if (options?.type === 'date') format = String(i18n.global.t('date-fns_date_short'));
		if (options?.type === 'time') format = String(i18n.global.t(timeFormat));
	} else {
		format = options.format;
	}

	return localizedFormat(parseDate(value, options.type), format);
}
