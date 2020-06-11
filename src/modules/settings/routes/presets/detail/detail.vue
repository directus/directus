<template>
	<private-view :title="$t('editing_preset')">
		<template #title-outer:prepend>
			<v-button class="header-icon" rounded icon exact :to="backLink">
				<v-icon name="arrow_back" />
			</v-button>
		</template>

		<template #navigation>
			<settings-navigation />
		</template>

		<template #actions>
			<v-dialog v-model="confirmDelete">
				<template #activator="{ on }">
					<v-button rounded icon class="action-delete" :disabled="preset === null || id === '+'" @click="on">
						<v-icon name="delete" />
					</v-button>
				</template>

				<v-card>
					<v-card-title>{{ $t('delete_are_you_sure') }}</v-card-title>

					<v-card-actions>
						<v-button @click="confirmDelete = false" secondary>
							{{ $t('cancel') }}
						</v-button>
						<v-button @click="deleteAndQuit" class="action-delete" :loading="deleting">
							{{ $t('delete') }}
						</v-button>
					</v-card-actions>
				</v-card>
			</v-dialog>

			<v-button icon rounded :disabled="hasEdits === false" :loading="saving" @click="save">
				<v-icon name="check" />
			</v-button>
		</template>

		<div class="preset-detail">
			<v-form
				:fields="fields"
				:loading="loading"
				:initial-values="initialValues"
				:primary-key="id"
				v-model="edits"
			/>

			<div class="layout">
				<component
					v-if="values.layout && values.collection"
					:is="`layout-${values.layout}`"
					:collection="values.collection"
					:view-options.sync="viewOptions"
					:view-query.sync="viewQuery"
					:filters="values.filters || []"
					@update:filters="edits.filters = $event"
					readonly
				/>
			</div>
		</div>

		<template #drawer>
			<drawer-detail icon="info_outline" :title="$t('information')" close>
				<div class="format-markdown" v-html="marked($t('page_help_settings_presets_detail'))" />
			</drawer-detail>
			<div class="layout-drawer">
				<portal-target name="drawer" />
			</div>
			<drawer-detail icon="help_outline" :title="$t('help_and_docs')">
				<div class="format-markdown" v-html="marked($t('page_help_settings_presets_detail'))" />
			</drawer-detail>
		</template>
	</private-view>
</template>

<script lang="ts">
import { defineComponent, computed, ref } from '@vue/composition-api';
import useProjectsStore from '@/stores/projects';
import SettingsNavigation from '../../../components/navigation';
import { CollectionPreset, Filter } from '@/stores/collection-presets/types';
import api from '@/api';
import i18n from '@/lang';
import useCollectionsStore from '@/stores/collections';
import layouts from '@/layouts';
import router from '@/router';
import useCollectionPresetsStore from '@/stores/collection-presets';
import marked from 'marked';

type User = {
	id: number;
	name: string;
};

type Role = {
	id: number;
	name: string;
};

type FormattedPreset = {
	id: number;
	scope: string;
	collection: string;
	layout: string | null;
	name: string | null;

	view_query: Record<string, any> | null;

	view_options: Record<string, any> | null;
	filters: readonly Filter[] | null;
};

export default defineComponent({
	components: { SettingsNavigation },
	props: {
		id: {
			type: String,
			default: null,
		},
	},
	setup(props) {
		const projectsStore = useProjectsStore();
		const collectionsStore = useCollectionsStore();
		const collectionPresetsStore = useCollectionPresetsStore();
		const { backLink } = useLinks();

		const isNew = computed(() => props.id === '+');

		const { loading: usersLoading, users } = useUsers();
		const { loading: rolesLoading, roles } = useRoles();
		const { loading: presetLoading, error, preset } = usePreset();
		const { fields } = useForm();
		const { edits, hasEdits, initialValues, values, viewQuery, viewOptions } = useValues();
		const { save, saving } = useSave();
		const { deleting, deleteAndQuit, confirmDelete } = useDelete();

		const loading = computed(() => usersLoading.value || presetLoading.value || rolesLoading.value);

		return {
			backLink,
			loading,
			error,
			preset,
			edits,
			fields,
			values,
			initialValues,
			saving,
			save,
			viewQuery,
			viewOptions,
			hasEdits,
			deleting,
			deleteAndQuit,
			confirmDelete,
			marked,
		};

		function useSave() {
			const saving = ref(false);

			return { saving, save };

			async function save() {
				const { currentProjectKey } = projectsStore.state;

				saving.value = true;

				const editsParsed: Partial<CollectionPreset> = {};

				if (edits.value.name) editsParsed.title = edits.value.name;
				if (edits.value.name?.length === 0) editsParsed.title = null;
				if (edits.value.collection) editsParsed.collection = edits.value.collection;
				if (edits.value.layout) editsParsed.view_type = edits.value.layout;
				if (edits.value.view_query) editsParsed.view_query = edits.value.view_query;
				if (edits.value.view_options) editsParsed.view_options = edits.value.view_options;
				if (edits.value.filters) editsParsed.filters = edits.value.filters;

				if (edits.value.scope) {
					if (edits.value.scope.startsWith('role_')) {
						editsParsed.role = +edits.value.scope.substring(5);
					} else if (edits.value.scope.startsWith('user_')) {
						editsParsed.user = +edits.value.scope.substring(5);
					}
				}

				try {
					if (isNew.value === true) {
						await api.post(`/${currentProjectKey}/collection_presets`, editsParsed);
					} else {
						await api.patch(`/${currentProjectKey}/collection_presets/${props.id}`, editsParsed);
					}

					await collectionPresetsStore.hydrate();

					edits.value = {};
				} catch (err) {
					console.error(err);
				} finally {
					saving.value = false;
					router.push(`/${currentProjectKey}/settings/presets`);
				}
			}
		}

		function useDelete() {
			const deleting = ref(false);
			const confirmDelete = ref(false);

			return { deleting, confirmDelete, deleteAndQuit };

			async function deleteAndQuit() {
				const { currentProjectKey } = projectsStore.state;

				deleting.value = true;

				try {
					await api.delete(`/${currentProjectKey}/collection_presets/${props.id}`);
					router.push(`/${currentProjectKey}/settings/presets`);
				} catch (error) {
					console.error(error);
				} finally {
					deleting.value = false;
				}
			}
		}

		function useValues() {
			const edits = ref<any>({});

			const hasEdits = computed(() => Object.keys(edits.value).length > 0);

			const initialValues = computed(() => {
				if (isNew.value === true) return {};
				if (preset.value === null) return {};

				let scope = 'all';

				if (preset.value.user !== null) {
					scope = `user_${preset.value.user}`;
				} else if (preset.value.role !== null) {
					scope = `role_${preset.value.role}`;
				}

				const value: FormattedPreset = {
					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					id: preset.value.id!,
					collection: preset.value.collection,
					layout: preset.value.view_type,
					name: preset.value.title,
					scope: scope,
					view_query: preset.value.view_query,
					view_options: preset.value.view_options,
					filters: preset.value.filters,
				};

				return value;
			});

			const values = computed(() => {
				return {
					...initialValues.value,
					...edits.value,
				};
			});

			const viewQuery = computed({
				get() {
					if (!values.value.view_query) return null;
					if (!values.value.layout) return null;

					return values.value.view_query[values.value.layout];
				},
				set(newQuery) {
					edits.value = {
						...edits.value,
						view_query: {
							...edits.value.view_query,
							[values.value.layout]: newQuery,
						},
					};
				},
			});

			const viewOptions = computed({
				get() {
					if (!values.value.view_options) return null;
					if (!values.value.layout) return null;

					return values.value.view_options[values.value.layout];
				},
				set(newOptions) {
					edits.value = {
						...edits.value,
						view_options: {
							...edits.value.view_options,
							[values.value.layout]: newOptions,
						},
					};
				},
			});

			return { edits, initialValues, values, viewQuery, viewOptions, hasEdits };
		}

		function usePreset() {
			const loading = ref(false);
			const error = ref(null);
			const preset = ref<CollectionPreset | null>(null);

			fetchPreset();

			return { loading, error, preset, fetchPreset };

			async function fetchPreset() {
				const { currentProjectKey } = projectsStore.state;
				loading.value = true;

				try {
					const response = await api.get(`/${currentProjectKey}/collection_presets/${props.id}`);

					preset.value = response.data.data;
				} catch (err) {
					error.value = err;
				} finally {
					loading.value = false;
				}
			}
		}

		function useLinks() {
			const backLink = computed(() => {
				const { currentProjectKey } = projectsStore.state;

				return `/${currentProjectKey}/settings/presets`;
			});

			return { backLink };
		}

		function useUsers() {
			const loading = ref(false);
			const error = ref(null);
			const users = ref<User[] | null>(null);

			fetchUsers();

			return { loading, error, users };

			async function fetchUsers() {
				const { currentProjectKey } = projectsStore.state;
				loading.value = true;

				try {
					const response = await api.get(`/${currentProjectKey}/users`, {
						params: {
							fields: ['first_name', 'last_name', 'id'],
						},
					});

					users.value = response.data.data.map((user: any) => ({
						name: user.first_name + ' ' + user.last_name,
						id: user.id,
					}));
				} catch (err) {
					error.value = err;
				} finally {
					loading.value = false;
				}
			}
		}

		function useRoles() {
			const loading = ref(false);
			const error = ref(null);
			const roles = ref<Role[] | null>(null);

			fetchRoles();

			return { loading, error, roles };

			async function fetchRoles() {
				const { currentProjectKey } = projectsStore.state;
				loading.value = true;

				try {
					const response = await api.get(`/${currentProjectKey}/roles`, {
						params: {
							fields: ['name', 'id'],
						},
					});

					roles.value = response.data.data;
				} catch (err) {
					error.value = err;
				} finally {
					loading.value = false;
				}
			}
		}

		function useForm() {
			const scopeChoices = computed(() => {
				if (usersLoading.value || rolesLoading.value) return [];

				const options = [
					{
						text: i18n.t('all'),
						value: 'all',
					},
				];

				roles.value?.forEach((role) => {
					options.push({ text: i18n.t('role') + ' ' + role.name, value: `role_${role.id}` });
				});

				users.value?.forEach((user) => {
					options.push({ text: i18n.t('user') + ' ' + user.name, value: `user_${user.id}` });
				});

				return options;
			});

			const systemCollectionWhiteList = ['directus_users', 'directus_files'];

			const fields = computed(() => [
				{
					field: 'collection',
					name: i18n.t('collection'),
					interface: 'dropdown',
					options: {
						choices: collectionsStore.state.collections
							.map((collection) => ({
								text: collection.name,
								value: collection.collection,
							}))
							.filter((option) => {
								if (option.value.startsWith('directus_'))
									return systemCollectionWhiteList.includes(option.value);

								return true;
							}),
					},
					width: 'half',
				},
				{
					field: 'scope',
					name: i18n.t('scope'),
					interface: 'dropdown',
					options: {
						choices: scopeChoices.value,
					},
					width: 'half',
				},
				{
					field: 'layout',
					name: i18n.t('layout'),
					interface: 'dropdown',
					options: {
						choices: layouts.map((layout) => ({
							text: layout.name,
							value: layout.id,
						})),
					},
					width: 'half',
				},
				{
					field: 'name',
					name: i18n.t('name'),
					interface: 'text-input',
					width: 'half',
					options: {
						placeholder: i18n.t('preset_name_placeholder'),
					},
				},
				{
					field: 'divider',
					name: i18n.t('divider'),
					interface: 'divider',
					width: 'fill',
					options: {
						title: i18n.t('layout_preview'),
						color: '#2F80ED',
					},
				},
			]);

			return { fields };
		}
	},
});
</script>

<style lang="scss" scoped>
.header-icon {
	--v-button-background-color: var(--warning-25);
	--v-button-color: var(--warning);
	--v-button-background-color-hover: var(--warning-50);
	--v-button-color-hover: var(--warning);
}

.action-delete {
	--v-button-background-color: var(--danger-25);
	--v-button-color: var(--danger);
	--v-button-background-color-hover: var(--danger-50);
	--v-button-color-hover: var(--danger);
}

.preset-detail {
	padding: var(--content-padding);
	padding-bottom: var(--content-padding-bottom);
}

.layout {
	--content-padding: 0;

	margin-top: 48px;
}

.layout-drawer {
	--drawer-detail-icon-color: var(--warning);
}
</style>
