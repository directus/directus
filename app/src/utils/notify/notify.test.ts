import Vue from 'vue';
import VueCompositionAPI from '@vue/composition-api';
import notify from './notify';
import { useNotificationsStore } from '@/stores/';

describe('Utils / Notify', () => {
	beforeAll(() => {
		Vue.use(VueCompositionAPI);
	});

	it('Calls notificationsStore.add with the passed notification', () => {
		const notificationsStore = useNotificationsStore();
		jest.spyOn(notificationsStore as any, 'add');

		const notification = {
			title: 'test',
		};

		notify(notification);

		expect(notificationsStore.add).toHaveBeenCalledWith(notification);
	});
});
