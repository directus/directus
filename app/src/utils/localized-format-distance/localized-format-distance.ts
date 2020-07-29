import formatDistanceOriginal from 'date-fns/formatDistance';
import getDateFNSLocale from '@/utils/get-date-fns-locale';

type LocalizedFormatDistance = (...a: Parameters<typeof formatDistanceOriginal>) => Promise<string>;

export const localizedFormatDistance: LocalizedFormatDistance = async (date, baseDate, options): Promise<string> => {
	return formatDistanceOriginal(date, baseDate, {
		...options,
		locale: await getDateFNSLocale(),
	});
};
