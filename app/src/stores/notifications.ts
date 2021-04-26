import { createStore } from 'pinia';
import { Notification, NotificationRaw } from '@/types';
import { nanoid } from 'nanoid';
import { reverse, sortBy } from 'lodash';

export const useNotificationsStore = createStore({
	id: 'notificationsStore',
	state: () => ({
		dialogs: [] as Notification[],
		queue: [] as Notification[],
		previous: [] as Notification[],
	}),
	actions: {
		add(notification: NotificationRaw) {
			const id = nanoid();
			const timestamp = Date.now();

			if (notification.dialog === true) {
				notification.persist = true;

				this.state.dialogs = [
					...this.state.dialogs,
					{
						...notification,
						id,
						timestamp,
					},
				];
			} else {
				this.state.queue = [
					...this.state.queue,
					{
						...notification,
						id,
						timestamp,
					},
				];
			}

			if (notification.persist !== true) {
				setTimeout(() => {
					this.remove(id);
				}, 3000);
			}

			return id;
		},
		hide(id: string) {
			const queues = [...this.state.queue, ...this.state.dialogs];
			const toBeHidden = queues.find((n) => n.id === id);
			if (!toBeHidden) return;

			if (toBeHidden.dialog === true) this.state.dialogs = this.state.dialogs.filter((n) => n.id !== id);
			else this.state.queue = this.state.queue.filter((n) => n.id !== id);

			this.state.previous = [...this.state.previous, toBeHidden];
		},
		remove(id: string) {
			const queues = [...this.state.queue, ...this.state.dialogs];

			const toBeRemoved = queues.find((n) => n.id === id);
			if (!toBeRemoved) return;

			if (toBeRemoved.dialog === true) this.state.dialogs = this.state.dialogs.filter((n) => n.id !== id);
			else this.state.queue = this.state.queue.filter((n) => n.id !== id);
		},
		update(id: string, updates: Partial<Notification>) {
			this.state.queue = this.state.queue.map(updateIfNeeded);
			this.state.dialogs = this.state.dialogs.map(updateIfNeeded);
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
			const all = [...state.queue, ...state.previous.filter((l) => l.dialog !== true)];
			const chronologicalAll = reverse(sortBy(all, ['timestamp']));
			const newestFour = chronologicalAll.slice(0, 4);
			return reverse(newestFour);
		},
	},
});
