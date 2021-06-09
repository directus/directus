import { Notification, NotificationRaw } from '@/types';
import { reverse, sortBy } from 'lodash';
import { nanoid } from 'nanoid';
import { defineStore } from 'pinia';

export const useNotificationsStore = defineStore({
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

				this.dialogs = [
					...this.dialogs,
					{
						...notification,
						id,
						timestamp,
					},
				];
			} else {
				this.queue = [
					...this.queue,
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
			const queues = [...this.queue, ...this.dialogs];
			const toBeHidden = queues.find((n) => n.id === id);
			if (!toBeHidden) return;

			if (toBeHidden.dialog === true) this.dialogs = this.dialogs.filter((n) => n.id !== id);
			else this.queue = this.queue.filter((n) => n.id !== id);

			this.previous = [...this.previous, toBeHidden];
		},
		remove(id: string) {
			const queues = [...this.queue, ...this.dialogs];

			const toBeRemoved = queues.find((n) => n.id === id);
			if (!toBeRemoved) return;

			if (toBeRemoved.dialog === true) this.dialogs = this.dialogs.filter((n) => n.id !== id);
			else this.queue = this.queue.filter((n) => n.id !== id);
		},
		update(id: string, updates: Partial<Notification>) {
			this.queue = this.queue.map(updateIfNeeded);
			this.dialogs = this.dialogs.map(updateIfNeeded);
			this.previous = this.queue.map(updateIfNeeded);

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
		lastFour(): Notification[] {
			const all = [...this.queue, ...this.previous.filter((l) => l.dialog !== true)];
			const chronologicalAll = reverse(sortBy(all, ['timestamp']));
			const newestFour = chronologicalAll.slice(0, 4);
			return reverse(newestFour);
		},
	},
});
