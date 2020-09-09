import { TranslateResult } from 'vue-i18n';

export type FancySelectItem = {
	icon: string;
	value: string | number;
	text: string | TranslateResult;
	description?: string | TranslateResult;
	divider?: boolean;
	iconRight?: string;
};
