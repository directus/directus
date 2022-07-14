import { getDateFNSLocale } from '@/utils/get-date-fns-locale';
import formatDistanceStrict from 'date-fns/formatDistanceStrict';

type LocalizedFormatDistanceStrict = (...a: Parameters<typeof formatDistanceStrict>) => string;

export const localizedFormatDistanceStrict: LocalizedFormatDistanceStrict = (date, baseDate, options): string => {
	return formatDistanceStrict(date, baseDate, {
		...options,
		locale: getDateFNSLocale(),
	});
};
