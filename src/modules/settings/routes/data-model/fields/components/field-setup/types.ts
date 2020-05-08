import { TranslateResult } from 'vue-i18n';

export type LocalType = 'standard' | 'relational' | 'file' | 'files';

export type Tab = {
	text: string | TranslateResult;
	value: string;
};
