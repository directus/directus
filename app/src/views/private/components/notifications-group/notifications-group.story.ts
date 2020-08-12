import readme from './readme.md';
import { defineComponent } from '@vue/composition-api';
import { useNotificationsStore } from '@/stores/';
import { NotificationRaw } from '@/types';
import NotificationsGroup from './notifications-group.vue';
import withPadding from '../../../../../.storybook/decorators/with-padding';

export default {
	title: 'Views / Private / Components / Notifications Group',
	decorators: [withPadding],
	parameters: {
		notes: readme,
	},
};

const demoNotifications: NotificationRaw[] = [
	{
		title: 'Saved successfully',
		icon: 'check',
		type: 'success',
	},
	{
		title: 'Whoops...',
		text: 'Something went wrong. Please try again later.',
		persist: true,
		icon: 'error',
		type: 'error',
	},
	{
		title: 'Multiple users are editing this item',
		text: 'Ben Haynes is currently editing this item.',
		type: 'warning',
		icon: 'warning',
	},
	{
		title: 'Update available',
		text: 'Directus v9 has been released.',
		type: 'info',
	},
];

export const basic = () =>
	defineComponent({
		components: { NotificationsGroup },
		setup() {
			const notificationsStore = useNotificationsStore();

			return { add };

			function add() {
				const randomIndex = Math.floor(Math.random() * demoNotifications.length);
				notificationsStore.add(demoNotifications[randomIndex]);
			}
		},
		template: `
		<div>
			<v-button @click="add">Add notification</v-button>
			<notifications-group />
		</div>
	`,
	});
