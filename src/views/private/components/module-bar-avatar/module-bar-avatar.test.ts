import { shallowMount, createLocalVue } from '@vue/test-utils';
import useUserStore from '@/stores/user';
import useProjectsStore from '@/stores/projects';
import ModuleBarAvatar from './module-bar-avatar.vue';
import VueCompositionAPI from '@vue/composition-api';
import { i18n } from '@/lang/';
import VueRouter from 'vue-router';

import VIcon from '@/components/v-icon';
import VButton from '@/components/v-button';
import VAvatar from '@/components/v-avatar';
import VDialog from '@/components/v-dialog';
import VOverlay from '@/components/v-dialog';
import VCard, { VCardTitle, VCardActions } from '@/components/v-card';

const localVue = createLocalVue();
localVue.use(VueCompositionAPI);
localVue.use(VueRouter);

localVue.component('v-icon', VIcon);
localVue.component('v-button', VButton);
localVue.component('v-avatar', VAvatar);
localVue.component('v-dialog', VDialog);
localVue.component('v-card', VCard);
localVue.component('v-card-title', VCardTitle);
localVue.component('v-card-actions', VCardActions);
localVue.component('v-overlay', VOverlay);

describe('Views / Private / Module Bar Avatar', () => {
	let req: any = {};

	beforeEach(() => {
		req = {};
	});

	it('Returns correct avatar url for thumbnail key', () => {
		const userStore = useUserStore(req);
		useProjectsStore(req);

		userStore.state.currentUser = {
			id: 1,
			avatar: {
				data: {
					thumbnails: [
						{
							key: 'test',
							url: 'test'
						},
						{
							key: 'directus-small-crop',
							url: 'test1'
						}
					]
				}
			}
		} as any;

		const component = shallowMount(ModuleBarAvatar, {
			localVue,
			i18n,
			stubs: {
				'v-hover': '<div><slot v-bind="{ hover: false }" /></div>'
			}
		});

		expect((component.vm as any).avatarURL).toBe('test1');
	});

	it('Returns null if avatar is null', () => {
		const userStore = useUserStore(req);
		useProjectsStore(req);

		userStore.state.currentUser = {
			id: 1,
			avatar: null
		} as any;

		const component = shallowMount(ModuleBarAvatar, {
			localVue,
			i18n,
			stubs: {
				'v-hover': '<div><slot v-bind="{ hover: false }" /></div>'
			}
		});

		expect((component.vm as any).avatarURL).toBe(null);
	});

	it('Returns null if thumbnail can not be found', () => {
		const userStore = useUserStore(req);
		useProjectsStore(req);

		userStore.state.currentUser = {
			id: 1,
			avatar: {
				data: {
					thumbnails: [
						{
							key: 'fake',
							url: 'non-existent'
						}
					]
				}
			}
		} as any;

		const component = shallowMount(ModuleBarAvatar, {
			localVue,
			i18n,
			stubs: {
				'v-hover': '<div><slot v-bind="{ hover: false }" /></div>'
			}
		});

		expect((component.vm as any).avatarURL).toBe(null);
	});

	it('Calculates correct routes for user profile and sign out', () => {
		const userStore = useUserStore(req);
		const projectsStore = useProjectsStore(req);
		projectsStore.state.currentProjectKey = 'my-project';

		userStore.state.currentUser = {
			id: 1,
			avatar: null
		} as any;

		const component = shallowMount(ModuleBarAvatar, {
			localVue,
			i18n,
			stubs: {
				'v-hover': '<div><slot v-bind="{ hover: false }" /></div>'
			}
		});

		expect((component.vm as any).userProfileLink).toBe('/my-project/users/1');
		expect((component.vm as any).signOutLink).toBe('/my-project/logout');
	});
});
