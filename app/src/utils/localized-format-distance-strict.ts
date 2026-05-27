import { formatDistanceStrict } from 'date-fns';
import { getDateFNSLocale } from '@/utils/get-date-fns-locale';

type LocalizedFormatDistanceStrict = (...a: Parameters<typeof formatDistanceStrict>) => string;

export const localizedFormatDistanceStrict: LocalizedFormatDistanceStrict = (date, baseDate, options): string => {
	return formatDistanceStrict(date, baseDate, {
		...options,
		locale: getDateFNSLocale(),
	});
};
