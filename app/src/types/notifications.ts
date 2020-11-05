import VueI18n from 'vue-i18n';

export interface NotificationRaw {
	id?: string;
	persist?: boolean;
	title: string | VueI18n.TranslateResult;
	text?: string | VueI18n.TranslateResult;
	type?: 'info' | 'success' | 'warning' | 'error';
	icon?: string | null;
	closeable?: boolean;
	progress?: number;
	loading?: boolean;
	dialog?: boolean;
	error?: Error;
}

export interface Notification extends NotificationRaw {
	readonly id: string;
	readonly timestamp: number;
}
