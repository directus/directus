import api from '@/api';
import { defineModule } from '@directus/shared/utils';
import { useCollectionsStore, useFieldsStore, useThemeStore, useUserStore } from '@/stores';
import RouterPass from '@/utils/router-passthrough';
import Collections from './routes/data-model/collections/collections.vue';
import FieldDetail from './routes/data-model/field-detail/field-detail.vue';
import Fields from './routes/data-model/fields/fields.vue';
import NewCollection from './routes/data-model/new-collection.vue';
import NotFound from './routes/not-found.vue';
import PresetsCollection from './routes/presets/collection/collection.vue';
import PresetsItem from './routes/presets/item.vue';
import Project from './routes/project/project.vue';
import ThemeEditor from './routes/theme/theme-editor.vue';
import NewRole from './routes/roles/add-new.vue';
import RolesCollection from './routes/roles/collection.vue';
import RolesItem from './routes/roles/item/item.vue';
import RolesPermissionsDetail from './routes/roles/permissions-detail/permissions-detail.vue';
import RolesPublicItem from './routes/roles/public-item.vue';
import WebhooksCollection from './routes/webhooks/collection.vue';
import WebhooksItem from './routes/webhooks/item.vue';
import TranslationStringsCollection from './routes/translation-strings/collection.vue';
import { User } from '@directus/shared/types';

export default defineModule({
	id: 'settings',
	name: '$t:settings',
	icon: 'settings',
	color: 'var(--g-color-primary-normal)',
	routes: [
		{
			path: '',
			redirect: '/settings/data-model',
		},
		{
			name: 'settings-project',
			path: 'project',
			component: Project,
		},
		{
			path: 'themes',
			component: RouterPass,
			children: [
				{
					path: '',
					redirect: () => {
						const userStore = useUserStore();
						let userSetTheme = (userStore.currentUser as User)?.theme || 'light';
						if (userSetTheme === 'auto') {
							if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
								userSetTheme = 'dark';
							} else {
								userSetTheme = 'light';
							}
						}

						return {
							name: 'settings-theme-editor',
							params: { theme: userSetTheme },
						};
					},
				},
				{
					name: 'settings-theme-editor',
					path: ':theme',
					component: ThemeEditor,
					beforeEnter(to) {
						const themeStore = useThemeStore();
						const theme = (to.params.theme as string) || 'light';
						themeStore.setEditingTheme(theme);
						themeStore.setAppTheme(theme);
						themeStore.populateFonts(theme);
					},
				},
			],
		},
		{
			path: 'data-model',
			component: RouterPass,
			children: [
				{
					name: 'settings-collections',
					path: '',
					component: Collections,
					beforeEnter() {
						const collectionsStore = useCollectionsStore();
						collectionsStore.hydrate();
					},
					children: [
						{
							path: '+',
							name: 'settings-add-new',
							components: {
								add: NewCollection,
							},
						},
					],
				},
				{
					name: 'settings-fields',
					path: ':collection',
					component: Fields,
					async beforeEnter(to) {
						const collectionsStore = useCollectionsStore();
						const info = collectionsStore.getCollection(to.params.collection as string);

						if (!info) {
							return {
								name: 'settings-not-found',
								params: { _: to.path.split('/').slice(1) },
							};
						}

						if (!info?.meta) {
							await api.patch(`/collections/${to.params.collection}`, { meta: {} });
						}

						const fieldsStore = useFieldsStore();
						fieldsStore.hydrate();
					},
					props: (route) => ({
						collection: route.params.collection,
						field: route.params.field,
						type: route.query.type,
					}),
					children: [
						{
							path: ':field',
							name: 'settings-fields-field',
							components: {
								field: FieldDetail,
							},
						},
					],
				},
			],
		},
		{
			path: 'roles',
			component: RouterPass,
			children: [
				{
					name: 'settings-roles-collection',
					path: '',
					component: RolesCollection,
					children: [
						{
							path: '+',
							name: 'settings-add-new-role',
							components: {
								add: NewRole,
							},
						},
					],
				},
				{
					path: 'public',
					component: RolesPublicItem,
					props: true,
					children: [
						{
							path: ':permissionKey',
							components: {
								permissionsDetail: RolesPermissionsDetail,
							},
						},
					],
				},
				{
					name: 'settings-roles-item',
					path: ':primaryKey',
					component: RolesItem,
					props: true,
					children: [
						{
							path: ':permissionKey',
							components: {
								permissionsDetail: RolesPermissionsDetail,
							},
						},
					],
				},
			],
		},
		{
			path: 'presets',
			component: RouterPass,
			children: [
				{
					name: 'settings-presets-collection',
					path: '',
					component: PresetsCollection,
				},
				{
					name: 'settings-presets-item',
					path: ':id',
					component: PresetsItem,
					props: true,
				},
			],
		},
		{
			path: 'webhooks',
			component: RouterPass,
			children: [
				{
					name: 'settings-webhooks-collection',
					path: '',
					component: WebhooksCollection,
				},
				{
					name: 'settings-webhooks-item',
					path: ':primaryKey',
					component: WebhooksItem,
					props: true,
				},
			],
		},
		{
			path: 'translation-strings',
			component: RouterPass,
			children: [
				{
					name: 'settings-translation-strings-collection',
					path: '',
					component: TranslationStringsCollection,
				},
			],
		},
		{
			name: 'settings-not-found',
			path: ':_(.+)+',
			component: NotFound,
		},
	],
	preRegisterCheck: (user) => {
		return user.role.admin_access === true;
	},
});
