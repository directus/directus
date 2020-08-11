import { useNotificationsStore } from '@/stores/';
import { NotificationRaw } from '@/types';

export default function notify(notification: NotificationRaw) {
	const notificationsStore = useNotificationsStore();
	notificationsStore.add(notification);
}
