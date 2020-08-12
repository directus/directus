import { createStore } from 'pinia';
import { Notification, NotificationRaw } from '@/types';
import { nanoid } from 'nanoid';
import { reverse, sortBy } from 'lodash';

export const useNotificationsStore = createStore({
	id: 'notificationsStore',
	state: () => ({
		queue: [] as Notification[],
		previous: [] as Notification[],
	}),
	actions: {
		add(notification: NotificationRaw) {
			const id = nanoid();
			const timestamp = Date.now();

			this.state.queue = [
				...this.state.queue,
				{
					...notification,
					id,
					timestamp,
				},
			];

			if (notification.persist !== true) {
				setTimeout(() => {
					this.remove(id);
				}, 3000);
			}

			return id;
		},
		remove(id: string) {
			const toBeRemoved = this.state.queue.find((n) => n.id === id);

			if (!toBeRemoved) return;

			this.state.queue = this.state.queue.filter((n) => n.id !== id);
			this.state.previous = [...this.state.previous, toBeRemoved];
		},
		update(id: string, updates: Partial<Notification>) {
			this.state.queue = this.state.queue.map(updateIfNeeded);
			this.state.previous = this.state.queue.map(updateIfNeeded);

			function updateIfNeeded(notification: Notification) {
				if (notification.id === id) {
					return {
						...notification,
						...updates,
					};
				}
				return notification;
			}
		},
	},
	getters: {
		lastFour(state) {
			const all = [...state.queue, ...state.previous];
			const chronologicalAll = reverse(sortBy(all, ['timestamp']));
			const newestFour = chronologicalAll.slice(0, 4);
			return reverse(newestFour);
		},
	},
});
