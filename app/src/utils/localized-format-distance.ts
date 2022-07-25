import { getDateFNSLocale } from '@/utils/get-date-fns-locale';
import formatDistanceOriginal from 'date-fns/formatDistance';

type LocalizedFormatDistance = (...a: Parameters<typeof formatDistanceOriginal>) => string;

export const localizedFormatDistance: LocalizedFormatDistance = (date, baseDate, options): string => {
	return formatDistanceOriginal(date, baseDate, {
		...options,
		locale: getDateFNSLocale(),
	});
};
