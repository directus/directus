import { useI18n } from 'vue-i18n';

export function translate(literal: any): string {
	const { t } = useI18n();

	let translated = literal;

	if (typeof literal === 'string' && literal.startsWith('$t:')) translated = t(literal.replace('$t:', ''));

	return translated;
}
