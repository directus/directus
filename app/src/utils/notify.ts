import { useNotificationsStore } from '@/stores/';
import { SnackbarRaw } from '@/types';

let store: any;

export function notify(notification: SnackbarRaw): void {
	if (!store) store = useNotificationsStore();
	store.add(notification);
}
