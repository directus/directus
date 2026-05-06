import { i18n } from '@/lang';
import { formatNumber } from '@/utils/format-number';

/**
 * Formats a duration in seconds into the largest whole unit (years, months, weeks, or days).
 */
export function formatTimeframe(seconds: number): string {
	const locale = i18n.global.locale.value;
	const days = Math.floor(seconds / 86400);

	if (days % 365 === 0) return formatNumber(days / 365, locale, { style: 'unit', unit: 'year', unitDisplay: 'long' });
	if (days % 30 === 0) return formatNumber(days / 30, locale, { style: 'unit', unit: 'month', unitDisplay: 'long' });
	if (days % 7 === 0) return formatNumber(days / 7, locale, { style: 'unit', unit: 'week', unitDisplay: 'long' });
	return formatNumber(days, locale, { style: 'unit', unit: 'day', unitDisplay: 'long' });
}
