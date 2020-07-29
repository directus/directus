import formatOriginal from 'date-fns/format';
import getDateFNSLocale from '@/utils/get-date-fns-locale';

type localizedFormat = (...a: Parameters<typeof formatOriginal>) => Promise<string>;

export const localizedFormat: localizedFormat = async (date, format, options): Promise<string> => {
	return formatOriginal(date, format, {
		...options,
		locale: await getDateFNSLocale(),
	});
};
