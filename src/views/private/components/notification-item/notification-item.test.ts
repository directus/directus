import { mount, createLocalVue } from '@vue/test-utils';
import VueCompositionAPI from '@vue/composition-api';
import NotificationItem from './notification-item.vue';
import useNotificationsStore from '@/stores/notifications/';
import VIcon from '@/components/v-icon';

const localVue = createLocalVue();
localVue.use(VueCompositionAPI);
localVue.component('v-icon', VIcon);

describe('Views / Private / Components / Notification Item', () => {
	it('Calls remove with the notification ID automatically', () => {
		jest.useFakeTimers();

		const notificationsStore = useNotificationsStore();
		jest.spyOn(notificationsStore as any, 'remove');
		mount(NotificationItem, {
			localVue,
			propsData: {
				id: '123',
				title: 'Test'
			}
		});
		jest.runAllTimers();
		expect(notificationsStore.remove).toHaveBeenCalledWith('123');
	});

	it('Does not call remove with id after 1 second when persist is enabled', () => {
		jest.useFakeTimers();

		const notificationsStore = useNotificationsStore();
		jest.spyOn(notificationsStore as any, 'remove');
		mount(NotificationItem, {
			localVue,
			propsData: {
				id: '123',
				title: 'Test',
				persist: true
			}
		});
		jest.runAllTimers();
		expect(notificationsStore.remove).not.toHaveBeenCalledWith('123');
	});

	it('Calls remove with id on close click if persist is enabled', () => {
		const notificationsStore = useNotificationsStore();
		jest.spyOn(notificationsStore as any, 'remove');
		const component = mount(NotificationItem, {
			localVue,
			propsData: {
				id: '123',
				title: 'Test',
				persist: true
			}
		});

		component.find('.close').trigger('click');
		expect(notificationsStore.remove).toHaveBeenCalledWith('123');
	});
});
