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
	/** IANA timezone identifier (e.g., 'America/New_York', 'Europe/London', 'UTC'). If not provided, uses local timezone. */
	tz?: string;
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

	const date = parseDate(value, options.type);

	// If timezone is specified, adjust the date to display in that timezone
	if (options.type === 'timestamp' && options.tz && options.tz.trim()) {
		// Get date components in target timezone
		const targetFormatter = new Intl.DateTimeFormat('en-US', {
			timeZone: options.tz,
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit',
			hour12: false,
		});

		const parts = targetFormatter.formatToParts(date);
		const partsMap: Record<string, string> = {};

		for (const part of parts) {
			partsMap[part.type] = part.value;
		}

		// Create a date string in ISO format and parse it as local time
		// This creates a date that, when formatted locally, shows the target timezone values
		const year = partsMap.year!;
		const month = partsMap.month!.padStart(2, '0');
		const day = partsMap.day!.padStart(2, '0');
		const hour = partsMap.hour!.padStart(2, '0');
		const minute = partsMap.minute!.padStart(2, '0');
		const second = partsMap.second!.padStart(2, '0');

		// Parse as local time (this will be formatted by date-fns in local timezone)
		const adjustedDate = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`);

		return localizedFormat(adjustedDate, format);
	}

	return localizedFormat(date, format);
}
