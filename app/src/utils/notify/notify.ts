import useNotificationsStore from '@/stores/notifications/';
import { NotificationRaw } from '@/stores/notifications/types';

export default function notify(notification: NotificationRaw) {
	const notificationsStore = useNotificationsStore();
	notificationsStore.add(notification);
}
