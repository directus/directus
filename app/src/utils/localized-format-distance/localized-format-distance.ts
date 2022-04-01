import getDateFNSLocale from '@/utils/get-date-fns-locale';
import formatDistanceOriginal from 'date-fns/formatDistance';

type LocalizedFormatDistance = (...a: Parameters<typeof formatDistanceOriginal>) => Promise<string>;

export const localizedFormatDistance: LocalizedFormatDistance = async (date, baseDate, options): Promise<string> => {
	return formatDistanceOriginal(date, baseDate, {
		...options,
		locale: await getDateFNSLocale(),
	});
};
