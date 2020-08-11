import { mount, createLocalVue } from '@vue/test-utils';
import VueCompositionAPI from '@vue/composition-api';
import NotificationItem from './notification-item.vue';
import { useNotificationsStore } from '@/stores/';
import VIcon from '@/components/v-icon';

const localVue = createLocalVue();
localVue.use(VueCompositionAPI);
localVue.component('v-icon', VIcon);

describe('Views / Private / Components / Notification Item', () => {
	it('Calls remove with id on close click if persist is enabled', () => {
		const notificationsStore = useNotificationsStore();
		jest.spyOn(notificationsStore as any, 'remove');
		const component = mount(NotificationItem, {
			localVue,
			propsData: {
				id: '123',
				title: 'Test',
				persist: true,
				showClose: true,
			},
		});

		component.find('.close').trigger('click');
		expect(notificationsStore.remove).toHaveBeenCalledWith('123');
	});
});
