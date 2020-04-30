import { useNotificationsStore } from './notifications';
import mountComposable from '../../../.jest/mount-composable';

describe('Stores / Notifications', () => {
	it('Returns the id of the created notification', () => {
		mountComposable(() => {
			const store = useNotificationsStore({});
			const id = store.add({ title: 'test' });
			expect(id).not.toBe(undefined);
		});
	});

	it('Returns the id of the created notification', () => {
		mountComposable(() => {
			const store = useNotificationsStore({});
			const id = store.add({ title: 'test' });
			jest.spyOn(Date, 'now').mockImplementation(() => 15);
			expect(store.state.queue[0].id).toBe(id);
		});
	});

	it('Removes a notification by ID', () => {
		mountComposable(() => {
			const store = useNotificationsStore({});
			store.state.queue = [
				{
					id: 'abc',
					title: 'test',
					timestamp: 1,
				},
				{
					id: 'def',
					title: 'test',
					timestamp: 2,
				},
				{
					id: 'ghi',
					title: 'test',
					timestamp: 3,
				},
			];
			store.remove('def');
			expect(store.state.queue[0].id).toBe('abc');
			expect(store.state.queue[1].id).toBe('ghi');
		});
	});
});
