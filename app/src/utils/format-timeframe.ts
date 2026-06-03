import { i18n } from '@/lang';
import { formatNumber } from '@/utils/format-number';

/**
 * Formats a duration in seconds into days
 */
export function formatTimeframe(seconds: number): string {
	const locale = i18n.global.locale.value;
	const days = Math.floor(seconds / 86400);
	return formatNumber(days, locale, { style: 'unit', unit: 'day', unitDisplay: 'long' });
}
