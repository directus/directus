import { useNotificationsStore } from '@/stores/';
import { NotificationRaw } from '@/types';

let store: any;

export function notify(notification: NotificationRaw): void {
	if (!store) store = useNotificationsStore();
	store.add(notification);
}
