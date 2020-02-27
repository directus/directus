import Vue from 'vue';
import markdown from './drawer-detail.readme.md';
import DrawerDetail from './drawer-detail.vue';
import PrivateView from '@/views/private';
import VButton from '@/components/v-button';

Vue.component('v-button', VButton);
Vue.component('drawer-detail', DrawerDetail);
Vue.component('private-view', PrivateView);

export default {
	title: 'Views / Private / Drawer Detail',
	component: DrawerDetail,
	parameters: {
		notes: markdown
	}
};

export const basic = () => `
<private-view>
	<template #drawer>
		<drawer-detail icon="person" title="Users">
			<p>Users:</p>
			<ul>
				<li>Admin</li>
			</ul>
		</drawer-detail>
		<drawer-detail icon="settings" title="Settings">
			Hello!
		</drawer-detail>
		<drawer-detail icon="shopping_cart" title="Extra">
			These details hold any other markup:

			<v-button style="margin-top: 12px;">I'm a button!</v-button>
		</drawer-detail>
	</template>
</private-view>
`;
