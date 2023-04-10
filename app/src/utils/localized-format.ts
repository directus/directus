import { getDateFNSLocale } from '@/utils/get-date-fns-locale';
import formatOriginal from 'date-fns/format';

type LocalizedFormat = (...a: Parameters<typeof formatOriginal>) => string;

export const localizedFormat: LocalizedFormat = (date, format, options): string => {
	return formatOriginal(date, format, {
		...options,
		locale: getDateFNSLocale(),
	});
};
