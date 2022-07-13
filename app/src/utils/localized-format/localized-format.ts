import { getDateFNSLocale } from '@/utils/get-date-fns-locale/';
import formatOriginal from 'date-fns/format';

type localizedFormat = (...a: Parameters<typeof formatOriginal>) => string;

export const localizedFormat: localizedFormat = (date, format, options): string => {
	return formatOriginal(date, format, {
		...options,
		locale: getDateFNSLocale(),
	});
};
