import Vue from 'vue';
import VueCompositionAPI from '@vue/composition-api';
import { mount, createLocalVue, Wrapper } from '@vue/test-utils';
import VIcon from '@/components/v-icon/';
import { useProjectsStore } from '@/stores/projects/';
import { ProjectWithKey } from '@/stores/projects/types';
import ClickOutside from '@/directives/click-outside';
import VMenu from '@/components/v-menu';
import VList, { VListItem, VListItemIcon, VListItemContent } from '@/components/v-list';
import PortalVue from 'portal-vue';

const localVue = createLocalVue();
localVue.use(VueCompositionAPI);
localVue.component('v-icon', VIcon);
localVue.component('v-list', VList);
localVue.component('v-list-item', VListItem);
localVue.component('v-list-item-icon', VListItemIcon);
localVue.component('v-list-item-content', VListItemContent);
localVue.component('v-menu', VMenu);
localVue.directive('click-outside', ClickOutside);
localVue.use(PortalVue);

import PublicView from './public-view.vue';

const mockProject: ProjectWithKey = {
	key: 'my-project',
	api: {
		version: '8.5.5',
		requires2FA: false,
		database: 'mysql',
		project_name: 'Thumper',
		project_logo: {
			full_url: 'http://localhost:8080/uploads/my-project/originals/19acff06-4969-5c75-9cd5-dc3f27506de2.svg',
			url: '/uploads/my-project/originals/19acff06-4969-5c75-9cd5-dc3f27506de2.svg',
			asset_url: '/uploads/my-project/assets/abc',
		},
		project_color: '#4CAF50',
		project_foreground: {
			full_url: 'http://localhost:8080/uploads/my-project/originals/f28c49b0-2b4f-571e-bf62-593107cbf2ec.svg',
			url: '/uploads/my-project/originals/f28c49b0-2b4f-571e-bf62-593107cbf2ec.svg',
			asset_url: '/uploads/my-project/assets/abc',
		},
		project_background: {
			full_url: 'http://localhost:8080/uploads/my-project/originals/03a06753-6794-4b9a-803b-3e1cd15e0742.jpg',
			url: '/uploads/my-project/originals/03a06753-6794-4b9a-803b-3e1cd15e0742.jpg',
			asset_url: '/uploads/my-project/assets/abc',
		},
		telemetry: true,
		default_locale: 'en-US',
		project_public_note:
			'**Welcome to the Directus Public Demo!**\n\nYou can sign in with `admin@example.com` and `password`. Occasionally users break things, but don’t worry… the whole server resets each hour.',
		sso: [],
	},
	server: {
		max_upload_size: 104857600,
		general: {
			php_version: '7.2.22-1+0~20190902.26+debian9~1.gbpd64eb7',
			php_api: 'fpm-fcgi',
		},
	},
	authenticated: true,
};

describe('Views / Public', () => {
	const store = useProjectsStore({});
	let component: Wrapper<Vue>;

	beforeEach(() => {
		store.reset();
		component = mount(PublicView, { localVue });
	});

	describe('Background', () => {
		it('Defaults background art to color when current project key is unknown', () => {
			expect((component.vm as any).artStyles).toEqual({
				background: '#263238',
				backgroundPosition: 'center center',
				backgroundSize: 'cover',
			});
		});

		it('Uses the project color when the current project key is set, but background image is not', async () => {
			store.state.projects = [
				{
					...mockProject,
					api: {
						...mockProject.api,
						project_background: null,
					},
				},
			] as any;
			store.state.currentProjectKey = 'my-project';

			await component.vm.$nextTick();

			expect((component.vm as any).artStyles).toEqual({
				background: '#4CAF50',
				backgroundPosition: 'center center',
				backgroundSize: 'cover',
			});
		});

		it('Uses the default background color when the current project has an error', () => {
			store.state.projects = [
				{
					key: 'my-project',
					status: 500,
					error: {
						code: 250,
						message: 'Test error',
					},
					authenticated: false,
				},
			];
			store.state.currentProjectKey = 'my-project';

			expect((component.vm as any).artStyles).toEqual({
				background: '#263238',
				backgroundPosition: 'center center',
				backgroundSize: 'cover',
			});
		});

		it('Uses the background image when the project has one set', () => {
			store.state.projects = [mockProject];
			store.state.currentProjectKey = 'my-project';
			expect((component.vm as any).artStyles).toEqual({
				background: `url(${mockProject.api?.project_background?.asset_url})`,
				backgroundPosition: 'center center',
				backgroundSize: 'cover',
			});
		});
	});
});
