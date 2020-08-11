import formatDistanceOriginal from 'date-fns/formatDistance';
import { getDateFNSLocale } from '@/utils';

type LocalizedFormatDistance = (...a: Parameters<typeof formatDistanceOriginal>) => Promise<string>;

export const localizedFormatDistance: LocalizedFormatDistance = async (date, baseDate, options): Promise<string> => {
	return formatDistanceOriginal(date, baseDate, {
		...options,
		locale: await getDateFNSLocale(),
	});
};
