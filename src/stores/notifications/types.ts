export interface NotificationRaw {
	id?: string;
	title: string;
	persist?: boolean;
	text?: string;
	type?: 'info' | 'success' | 'warning' | 'error';
	icon?: string | null;
}

export interface Notification extends NotificationRaw {
	readonly id: string;
}
