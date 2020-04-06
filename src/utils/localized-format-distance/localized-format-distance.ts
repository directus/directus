import formatDistanceOriginal from 'date-fns/formatDistance';
import { i18n } from '@/lang';

type LocalizedFormatDistance = (...a: Parameters<typeof formatDistanceOriginal>) => Promise<string>;

export const localizedFormatDistance: LocalizedFormatDistance = async (
	date,
	baseDate,
	options
): Promise<string> => {
	const lang = i18n.locale;

	const locale = (
		await import(
			/* webpackMode: 'lazy', webpackChunkName: 'df-[index]' */
			`date-fns/locale/${lang}/index.js`
		)
	).default;

	return formatDistanceOriginal(date, baseDate, {
		...options,
		locale,
	});
};
