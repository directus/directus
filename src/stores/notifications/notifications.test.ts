import { useNotificationsStore } from './notifications';
import mountComposition from '../../../.jest/mount-composition';

describe('Stores / Notifications', () => {
	it('Returns the id of the created notification', () => {
		mountComposition(() => {
			const store = useNotificationsStore({});
			const id = store.add({ title: 'test' });
			expect(id).not.toBe(undefined);
		});
	});

	it('Returns the id of the created notification', () => {
		mountComposition(() => {
			const store = useNotificationsStore({});
			const id = store.add({ title: 'test' });
			expect(store.state.queue[0]).toEqual({
				id,
				title: 'test'
			});
		});
	});

	it('Removes a notification by ID', () => {
		mountComposition(() => {
			const store = useNotificationsStore({});
			store.state.queue = [
				{
					id: 'abc',
					title: 'test'
				},
				{
					id: 'def',
					title: 'test'
				},
				{
					id: 'ghi',
					title: 'test'
				}
			];
			store.remove('def');
			expect(store.state.queue).toEqual([
				{
					id: 'abc',
					title: 'test'
				},
				{
					id: 'ghi',
					title: 'test'
				}
			]);
		});
	});
});
