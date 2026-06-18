import { format as formatOriginal } from 'date-fns';
import { getDateFNSLocale } from '@/utils/get-date-fns-locale';

type LocalizedFormat = (...a: Parameters<typeof formatOriginal>) => string;

function resolveCustomTokens(date: Date, formatStr: string): string {
	const placeholders: string[] = [];
	const withoutQuoted = formatStr.replace(/'([^']*)'/g, (match) => {
		placeholders.push(match);
		return `\x00${placeholders.length - 1}\x00`;
	});
	const resolved = withoutQuoted.replace(/(W+)/g, (match) => {
		const weekOfMonth = Math.ceil(date.getDate() / 7);
		return match.length > 1 ? String(weekOfMonth).padStart(match.length, '0') : String(weekOfMonth);
	});
	return resolved.replace(/\x00(\d+)\x00/g, (_match, index) => placeholders[Number(index)]);
}

export const localizedFormat: LocalizedFormat = (date, format, options): string => {
	return formatOriginal(date, resolveCustomTokens(date, format), {
		...options,
		locale: getDateFNSLocale(),
	});
};
