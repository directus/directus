import { createStore } from 'pinia';
import { Notification, NotificationRaw } from './types';
import nanoid from 'nanoid';

export const useNotificationsStore = createStore({
	id: 'useNotifications',
	state: () => ({
		queue: [] as Notification[]
	}),
	actions: {
		add(notification: NotificationRaw) {
			const id = nanoid();
			this.state.queue = [
				...this.state.queue,
				{
					...notification,
					id
				}
			];
			return id;
		},
		remove(id: string) {
			this.state.queue = this.state.queue.filter(n => n.id !== id);
		}
	}
});
