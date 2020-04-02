import readme from './readme.md';
import { defineComponent, ref, provide } from '@vue/composition-api';
import NotificationsPreview from './notifications-preview.vue';
import NotificationItem from '../notification-item/';
import DrawerButton from '../drawer-button/';
import useNotificationsStore from '@/stores/notifications';
import { NotificationRaw } from '@/stores/notifications/types';
import { i18n } from '@/lang';
import withPadding from '../../../../../.storybook/decorators/with-padding';
import VueRouter from 'vue-router';

export default {
	title: 'Views / Private / Components / Notifications Preview',
	parameters: {
		notes: readme,
	},
	decorators: [withPadding],
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
		i18n,
		router: new VueRouter(),
		components: { NotificationsPreview, NotificationItem, DrawerButton },
		setup() {
			const notificationsStore = useNotificationsStore({});
			const active = ref(false);

			provide('drawer-open', ref(true));

			return { add, active };

			function add() {
				const randomIndex = Math.floor(Math.random() * demoNotifications.length);
				notificationsStore.add(demoNotifications[randomIndex]);
			}
		},
		template: `
			<div style="width: 284px; background-color: var(--background-normal); height: 100%; display: flex; flex-direction: column;">
				<v-button style="margin: 8px" @click="add">Add notification</v-button>
				<div style="flex-grow: 1" />
				<notifications-preview v-model="active" />
			</div>
		`,
	});
