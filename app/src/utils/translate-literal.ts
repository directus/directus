import { i18n } from '@/lang';

export function translate(literal: string): string {
	let translated = literal;

	if (literal.startsWith('$t:')) translated = i18n.global.t(literal.replace('$t:', ''));

	return translated;
}
