import getDateFNSLocale from '@/utils/get-date-fns-locale';
import formatDistanceStrict from 'date-fns/formatDistanceStrict';

type LocalizedFormatDistanceStrict = (...a: Parameters<typeof formatDistanceStrict>) => Promise<string>;

export const localizedFormatDistanceStrict: LocalizedFormatDistanceStrict = async (
	date,
	baseDate,
	options
): Promise<string> => {
	return formatDistanceStrict(date, baseDate, {
		...options,
		locale: await getDateFNSLocale(),
	});
};
