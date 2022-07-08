import { i18n } from '@/lang';

export function translate(literal: any): string {
	let translated = literal;

	if (typeof literal === 'string' && literal.startsWith('$t:')) translated = i18n.global.t(literal.replace('$t:', ''));

	return translated;
}
