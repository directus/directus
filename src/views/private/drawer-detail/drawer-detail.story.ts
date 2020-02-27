import Vue from 'vue';
import markdown from './drawer-detail.readme.md';
import DrawerDetail from './drawer-detail.vue';
import PrivateView from '@/views/private';
import VButton from '@/components/v-button';
import VueRouter from 'vue-router';

Vue.component('v-button', VButton);
Vue.component('drawer-detail', DrawerDetail);
Vue.component('private-view', PrivateView);

Vue.use(VueRouter);

const router = new VueRouter();

export default {
	title: 'Views / Private / Drawer Detail',
	component: DrawerDetail,
	parameters: {
		notes: markdown
	}
};

export const basic = () => ({
	router: router,
	template: `
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
`
});
