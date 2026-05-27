import { format as formatOriginal } from 'date-fns';
import { getDateFNSLocale } from '@/utils/get-date-fns-locale';

type LocalizedFormat = (...a: Parameters<typeof formatOriginal>) => string;

export const localizedFormat: LocalizedFormat = (date, format, options): string => {
	return formatOriginal(date, format, {
		...options,
		locale: getDateFNSLocale(),
	});
};
