import { formatDistance as formatDistanceOriginal } from 'date-fns';
import { getDateFNSLocale } from '@/utils/get-date-fns-locale';

type LocalizedFormatDistance = (...a: Parameters<typeof formatDistanceOriginal>) => string;

export const localizedFormatDistance: LocalizedFormatDistance = (date, baseDate, options): string => {
	return formatDistanceOriginal(date, baseDate, {
		...options,
		locale: getDateFNSLocale(),
	});
};
