import markdown from './readme.md';
import withPadding from '../../../../../.storybook/decorators/with-padding';
import { defineComponent } from '@vue/composition-api';

import { useUserStore } from '@/stores/';
import ModuleBarAvatar from './module-bar-avatar.vue';
import { i18n } from '@/lang/';
import VueRouter from 'vue-router';

export default {
	title: 'Views / Private / Components / Module Bar Avatar',
	decorators: [withPadding],
	parameters: {
		notes: markdown,
	},
};

export const basic = () =>
	defineComponent({
		i18n,
		router: new VueRouter(),
		components: { ModuleBarAvatar },
		setup() {
			const req = {};
			const userStore = useUserStore(req);

			userStore.state.currentUser = {
				first_name: 'Admin',
				last_name: 'User',
				avatar: null,
			} as any;
		},
		template: `
			<div style="width: max-content; padding-top: 128px; background-color: #263238;">
				<module-bar-avatar />
			</div>
		`,
	});

export const withAvatar = () =>
	defineComponent({
		i18n,
		router: new VueRouter(),
		components: { ModuleBarAvatar },
		setup() {
			const req = {};

			const userStore = useUserStore(req);

			userStore.state.currentUser = {
				first_name: 'Admin',
				last_name: 'User',
				avatar: {
					data: {
						thumbnails: [
							{
								key: 'system-small-crop',
								url: 'https://randomuser.me/api/portraits/women/44.jpg',
							},
						],
					},
				},
			} as any;
		},
		template: `
			<div style="width: max-content; padding-top: 128px; background-color: #263238;">
				<module-bar-avatar />
			</div>
		`,
	});
