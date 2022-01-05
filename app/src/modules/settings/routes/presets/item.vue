<template>
	<component
		:is="layoutWrapper"
		v-slot="{ layoutState }"
		v-model:layout-options="layoutOptions"
		v-model:layout-query="layoutQuery"
		:filter="layoutFilter"
		:search="search"
		:collection="values.collection"
		readonly
	>
		<private-view :title="t('editing_preset')">
			<template #headline>
				<v-breadcrumb :items="[{ name: t('settings_presets'), to: '/settings/presets' }]" />
			</template>
			<template #title-outer:prepend>
				<v-button class="header-icon" rounded icon exact :to="backLink">
					<v-icon name="arrow_back" />
				</v-button>
			</template>

			<template #navigation>
				<settings-navigation />
			</template>

			<template #actions>
				<v-dialog v-model="confirmDelete" @esc="confirmDelete = false">
					<template #activator="{ on }">
						<v-button
							v-tooltip.bottom="t('delete_label')"
							rounded
							icon
							class="action-delete"
							:disabled="preset === null || id === '+'"
							@click="on"
						>
							<v-icon name="delete" outline />
						</v-button>
					</template>

					<v-card>
						<v-card-title>{{ t('delete_are_you_sure') }}</v-card-title>

						<v-card-actions>
							<v-button secondary @click="confirmDelete = false">
								{{ t('cancel') }}
							</v-button>
							<v-button kind="danger" :loading="deleting" @click="deleteAndQuit">
								{{ t('delete_label') }}
							</v-button>
						</v-card-actions>
					</v-card>
				</v-dialog>

				<v-button
					v-tooltip.bottom="t('save')"
					icon
					rounded
					:disabled="hasEdits === false"
					:loading="saving"
					@click="save"
				>
					<v-icon name="check" />
				</v-button>
			</template>

			<div class="preset-item">
				<v-form v-model="edits" :fields="fields" :loading="loading" :initial-values="initialValues" :primary-key="id" />

				<div class="layout">
					<component :is="`layout-${values.layout}`" v-if="values.layout && values.collection" v-bind="layoutState">
						<template #no-results>
							<v-info :title="t('no_results')" icon="search" center>
								{{ t('no_results_copy') }}
							</v-info>
						</template>

						<template #no-items>
							<v-info :title="t('item_count', 0)" center>
								{{ t('no_items_copy') }}
							</v-info>
						</template>
					</component>

					<v-notice v-else>
						{{ t('no_layout_collection_selected_yet') }}
					</v-notice>
				</div>
			</div>

			<template #sidebar>
				<sidebar-detail icon="info_outline" :title="t('information')" close>
					<div v-md="t('page_help_settings_presets_item')" class="page-description" />
				</sidebar-detail>

				<div class="layout-sidebar">
					<sidebar-detail icon="search" :title="t('search')">
						<v-input v-model="search" :placeholder="t('preset_search_placeholder')"></v-input>
					</sidebar-detail>

					<component
						:is="`layout-sidebar-${values.layout}`"
						v-if="values.layout && values.collection"
						v-bind="layoutState"
					/>

					<sidebar-detail icon="layers" :title="t('layout_options')">
						<div class="layout-options">
							<component
								:is="`layout-options-${values.layout}`"
								v-if="values.layout && values.collection"
								v-bind="layoutState"
							/>
						</div>
					</sidebar-detail>
				</div>
			</template>

			<v-dialog v-model="confirmLeave" @esc="confirmLeave = false">
				<v-card>
					<v-card-title>{{ t('unsaved_changes') }}</v-card-title>
					<v-card-text>{{ t('unsaved_changes_copy') }}</v-card-text>
					<v-card-actions>
						<v-button secondary @click="discardAndLeave">
							{{ t('discard_changes') }}
						</v-button>
						<v-button @click="confirmLeave = false">{{ t('keep_editing') }}</v-button>
					</v-card-actions>
				</v-card>
			</v-dialog>
		</private-view>
	</component>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, computed, ref } from 'vue';

import SettingsNavigation from '../../components/navigation.vue';
import { Preset, Filter } from '@directus/shared/types';
import api from '@/api';
import { useCollectionsStore, usePresetsStore } from '@/stores';
import { getLayouts } from '@/layouts';
import { useRouter, onBeforeRouteUpdate, onBeforeRouteLeave, NavigationGuard } from 'vue-router';
import { unexpectedError } from '@/utils/unexpected-error';
import { useLayout } from '@directus/shared/composables';
import useShortcut from '@/composables/use-shortcut';
import unsavedChanges from '@/composables/unsaved-changes';
import { isEqual } from 'lodash';

type FormattedPreset = {
	id: number;
	scope: string;
	collection: string;
	layout: string | null;
	name: string | null;
	search: string | null;

	layout_query: Record<string, any> | null;

	layout_options: Record<string, any> | null;
	filter: Filter | null;
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
		const { t } = useI18n();

		const router = useRouter();

		const collectionsStore = useCollectionsStore();
		const presetsStore = usePresetsStore();
		const { layouts } = getLayouts();
		const { backLink } = useLinks();

		const isNew = computed(() => props.id === '+');

		const { loading, preset } = usePreset();
		const { fields } = useForm();
		const { edits, hasEdits, initialValues, values, layoutQuery, layoutOptions, updateFilters, search } = useValues();
		const { save, saving } = useSave();
		const { deleting, deleteAndQuit, confirmDelete } = useDelete();

		const layoutFilter = computed<any>({
			get() {
				return values.value.filter ?? null;
			},
			set(newFilters) {
				updateFilters(newFilters);
			},
		});

		const layout = computed(() => values.value.layout);

		const { layoutWrapper } = useLayout(layout);

		useShortcut('meta+s', () => {
			if (hasEdits.value) save();
		});

		const isSavable = computed(() => {
			if (hasEdits.value === true) return true;
			return hasEdits.value;
		});

		unsavedChanges(isSavable);

		const confirmLeave = ref(false);
		const leaveTo = ref<string | null>(null);

		const editsGuard: NavigationGuard = (to) => {
			if (hasEdits.value) {
				confirmLeave.value = true;
				leaveTo.value = to.fullPath;
				return false;
			}
		};
		onBeforeRouteUpdate(editsGuard);
		onBeforeRouteLeave(editsGuard);

		return {
			t,
			backLink,
			loading,
			preset,
			edits,
			fields,
			values,
			initialValues,
			saving,
			save,
			layoutWrapper,
			layoutQuery,
			layoutOptions,
			layoutFilter,
			hasEdits,
			deleting,
			deleteAndQuit,
			confirmDelete,
			updateFilters,
			search,
			isSavable,
			confirmLeave,
			leaveTo,
			discardAndLeave,
		};

		function useSave() {
			const saving = ref(false);

			return { saving, save };

			async function save() {
				saving.value = true;

				const editsParsed: Partial<Preset> = {};

				if (edits.value.name) editsParsed.bookmark = edits.value.name;
				if (edits.value.name?.length === 0) editsParsed.bookmark = null;
				if (edits.value.collection) editsParsed.collection = edits.value.collection;
				if (edits.value.layout) editsParsed.layout = edits.value.layout;
				if (edits.value.layout_query) editsParsed.layout_query = edits.value.layout_query;
				if (edits.value.layout_options) editsParsed.layout_options = edits.value.layout_options;
				if (edits.value.filter) editsParsed.filter = edits.value.filter;
				editsParsed.search = edits.value.search;

				if (edits.value.scope) {
					if (edits.value.scope.startsWith('role_')) {
						editsParsed.role = edits.value.scope.substring(5);
						editsParsed.user = null;
					} else if (edits.value.scope.startsWith('user_')) {
						editsParsed.user = edits.value.scope.substring(5);
						editsParsed.role = null;
					} else {
						editsParsed.role = null;
						editsParsed.user = null;
					}
				}

				try {
					if (isNew.value === true) {
						await api.post(`/presets`, editsParsed);
					} else {
						await api.patch(`/presets/${props.id}`, editsParsed);
					}

					await presetsStore.hydrate();

					edits.value = {};
				} catch (err: any) {
					unexpectedError(err);
				} finally {
					saving.value = false;
					router.push(`/settings/presets`);
				}
			}
		}

		function useDelete() {
			const deleting = ref(false);
			const confirmDelete = ref(false);

			return { deleting, confirmDelete, deleteAndQuit };

			async function deleteAndQuit() {
				deleting.value = true;

				try {
					await api.delete(`/presets/${props.id}`);
					router.replace(`/settings/presets`);
				} catch (err: any) {
					unexpectedError(err);
				} finally {
					deleting.value = false;
				}
			}
		}

		function useValues() {
			const edits = ref<Record<string, any>>({});

			const hasEdits = computed(() => Object.keys(edits.value).length > 0);

			const initialValues = computed(() => {
				const defaultValues = {
					collection: null,
					layout: 'tabular',
					search: null,
					scope: 'all',
					layout_query: null,
					layout_options: null,
					filter: null,
				};
				if (isNew.value === true) return defaultValues;
				if (preset.value === null) return defaultValues;

				let scope = 'all';

				if (preset.value.user !== null) {
					scope = `user_${preset.value.user}`;
				} else if (preset.value.role !== null) {
					scope = `role_${preset.value.role}`;
				}

				const value: FormattedPreset = {
					id: preset.value.id!,
					collection: preset.value.collection,
					layout: preset.value.layout,
					name: preset.value.bookmark,
					search: preset.value.search,
					scope: scope,
					layout_query: preset.value.layout_query,
					layout_options: preset.value.layout_options,
					filter: preset.value.filter,
				};

				return value;
			});

			const values = computed(() => {
				return {
					...initialValues.value,
					...edits.value,
				};
			});

			const layoutQuery = computed<any>({
				get() {
					if (!values.value.layout_query) return null;
					if (!values.value.layout) return null;

					return values.value.layout_query[values.value.layout];
				},
				set(newQuery) {
					if (
						values.value.layout_query &&
						values.value.layout &&
						isEqual(newQuery, values.value.layout_query[values.value.layout])
					) {
						return;
					}

					edits.value = {
						...edits.value,
						layout_query: {
							...edits.value.layout_query,
							[values.value.layout || 'tabular']: newQuery,
						},
					};
				},
			});

			const layoutOptions = computed<any>({
				get() {
					if (!values.value.layout_options) return null;
					if (!values.value.layout) return null;

					return values.value.layout_options[values.value.layout];
				},
				set(newOptions) {
					if (
						values.value.layout_options &&
						values.value.layout &&
						isEqual(newOptions, values.value.layout_options[values.value.layout])
					) {
						return;
					}

					edits.value = {
						...edits.value,
						layout_options: {
							...edits.value.layout_options,
							[values.value.layout || 'tabular']: newOptions,
						},
					};
				},
			});

			const search = computed<string | null>({
				get() {
					return values.value.search;
				},
				set(newSearch) {
					edits.value = {
						...edits.value,
						search: newSearch,
					};
				},
			});

			return { edits, initialValues, values, layoutQuery, layoutOptions, hasEdits, updateFilters, search };

			function updateFilters(newFilter: Filter) {
				edits.value = {
					...edits.value,
					filter: newFilter,
				};
			}
		}

		function usePreset() {
			const loading = ref(false);
			const preset = ref<Preset | null>(null);

			fetchPreset();

			return { loading, preset, fetchPreset };

			async function fetchPreset() {
				if (props.id === '+') return;

				loading.value = true;

				try {
					const response = await api.get(`/presets/${props.id}`);

					preset.value = response.data.data;
				} catch (err: any) {
					unexpectedError(err);
				} finally {
					loading.value = false;
				}
			}
		}

		function useLinks() {
			const backLink = computed(() => {
				return `/settings/presets`;
			});

			return { backLink };
		}

		function useForm() {
			const systemCollectionWhiteList = ['directus_users', 'directus_files', 'directus_activity'];

			const fields = computed(() => [
				{
					field: 'collection',
					name: t('collection'),
					type: 'string',
					meta: {
						interface: 'select-dropdown',
						options: {
							choices: collectionsStore.collections
								.map((collection) => ({
									text: collection.name,
									value: collection.collection,
								}))
								.filter((option) => {
									if (option.value.startsWith('directus_')) return systemCollectionWhiteList.includes(option.value);

									return true;
								}),
						},
						width: 'half',
					},
				},
				{
					field: 'scope',
					name: t('scope'),
					type: 'string',
					meta: {
						interface: 'system-scope',
						width: 'half',
					},
				},
				{
					field: 'layout',
					name: t('layout'),
					type: 'string',
					meta: {
						interface: 'select-dropdown',
						options: {
							choices: layouts.value.map((layout) => ({
								text: layout.name,
								value: layout.id,
							})),
						},
						width: 'half',
					},
				},
				{
					field: 'name',
					name: t('name'),
					type: 'string',
					meta: {
						interface: 'input',
						width: 'half',
						options: {
							placeholder: t('preset_name_placeholder'),
						},
					},
				},
				{
					field: 'divider',
					name: t('divider'),
					type: 'alias',
					meta: {
						interface: 'presentation-divider',
						width: 'fill',
						options: {
							title: t('layout_preview'),
							icon: 'visibility',
						},
					},
				},
			]);

			return { fields };
		}

		function discardAndLeave() {
			if (!leaveTo.value) return;
			edits.value = {};
			confirmLeave.value = false;
			router.push(leaveTo.value);
		}
	},
});
</script>

<style lang="scss" scoped>
@import '@/styles/mixins/form-grid';

.header-icon {
	--v-button-background-color: var(--warning-10);
	--v-button-color: var(--warning);
	--v-button-background-color-hover: var(--warning-25);
	--v-button-color-hover: var(--warning);
}

.action-delete {
	--v-button-background-color: var(--danger-10);
	--v-button-color: var(--danger);
	--v-button-background-color-hover: var(--danger-25);
	--v-button-color-hover: var(--danger);
}

.preset-item {
	padding: var(--content-padding);
	padding-bottom: var(--content-padding-bottom);
}

.layout {
	--content-padding: 0px;
	--content-padding-bottom: 32px;

	position: relative;
	width: 100%;
	margin-top: 48px;
	overflow: auto;
}

.layout-sidebar {
	--sidebar-detail-icon-color: var(--warning);
	--sidebar-detail-color: var(--warning);
	--sidebar-detail-color-active: var(--warning);
	--form-vertical-gap: 24px;

	display: contents;
}

:deep(.layout-options) {
	--form-vertical-gap: 24px;

	@include form-grid;
}

:deep(.layout-options .type-label) {
	font-size: 1rem;
}

.subdued {
	color: var(--foreground-subdued);
	font-style: italic;
}
</style>
