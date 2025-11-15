<script setup lang="ts">
import api from '@/api';
import { useEditsGuard } from '@/composables/use-edits-guard';
import { useShortcut } from '@/composables/use-shortcut';
import { useExtensions } from '@/extensions';
import { useCollectionsStore } from '@/stores/collections';
import { usePresetsStore } from '@/stores/presets';
import { unexpectedError } from '@/utils/unexpected-error';
import { useLayout } from '@directus/composables';
import { isSystemCollection } from '@directus/system-data';
import { DeepPartial, Field, Filter, Preset } from '@directus/types';
import { isEqual } from 'lodash';
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import SettingsNavigation from '../../components/navigation.vue';

type FormattedPreset = {
	id: number;
	scope: string;
	collection: string;
	layout: string | null;
	name: string | null;
	search: string | null;
	icon: string;
	layout_query: Record<string, any> | null;
	color?: string | null;
	layout_options: Record<string, any> | null;
	filter: Filter | null;
};

interface Props {
	id?: string | null;
}

const props = withDefaults(defineProps<Props>(), {
	id: null,
});

const router = useRouter();

const collectionsStore = useCollectionsStore();
const presetsStore = usePresetsStore();
const { layouts } = useExtensions();

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

const layoutProps = computed(() => {
	if (values.value.layout === 'calendar') {
		return { height: 'auto' };
	}

	return undefined;
});

useShortcut('meta+s', () => {
	if (hasEdits.value) save();
});

const { confirmLeave, leaveTo } = useEditsGuard(hasEdits);

function useSave() {
	const saving = ref(false);

	return { saving, save };

	async function save() {
		saving.value = true;

		const editsParsed: Partial<Preset> = {};

		const keys = [
			'icon',
			'color',
			'collection',
			'layout',
			'layout_query',
			'layout_options',
			'filter',
			'search',
		] as (keyof Preset)[];

		if ('name' in edits.value) editsParsed.bookmark = edits.value.name;

		for (const key of keys) {
			if (key in edits.value) editsParsed[key] = edits.value[key];
		}

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
		} catch (error) {
			unexpectedError(error);
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
		if (deleting.value) return;

		deleting.value = true;

		try {
			await presetsStore.delete([Number(props.id)]);
			edits.value = {};
			router.replace(`/settings/presets`);
		} catch (error) {
			unexpectedError(error);
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
			icon: preset.value.icon,
			color: preset.value.color,
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
		} catch (error) {
			unexpectedError(error);
		} finally {
			loading.value = false;
		}
	}
}

function useForm() {
	const systemCollectionWhiteList = ['directus_users', 'directus_files', 'directus_activity'];

	const fields = computed<DeepPartial<Field>[]>(() => [
		{
			field: 'meta-group',
			type: 'alias',
			meta: {
				field: 'meta-group',
				special: ['alias', 'no-data', 'group'],
				interface: 'group-raw',
			},
		},
		{
			field: 'name',
			name: '$t:name',
			type: 'string',
			meta: {
				interface: 'system-input-translated-string',
				options: {
					placeholder: '$t:preset_name_placeholder',
				},
				width: 'half',
				group: 'meta-group',
			},
		},
		{
			field: 'icon',
			name: '$t:icon',
			type: 'string',
			meta: {
				interface: 'select-icon',
				width: 'half',
				group: 'meta-group',
			},
			schema: {
				default_value: 'bookmark',
			},
		},
		{
			field: 'color',
			name: '$t:color',
			type: 'string',
			meta: {
				interface: 'select-color',
				width: 'half',
				group: 'meta-group',
			},
		},
		{
			field: 'collection',
			name: '$t:collection',
			type: 'string',
			meta: {
				interface: 'select-dropdown',
				options: {
					choices: collectionsStore.sortedCollections
						.map((collection) => ({
							text: collection.collection,
							value: collection.collection,
						}))
						.filter((option) => {
							if (isSystemCollection(option.value)) return systemCollectionWhiteList.includes(option.value);

							return true;
						}),
				},
				width: 'half',
			},
		},
		{
			field: 'scope',
			name: '$t:scope',
			type: 'string',
			meta: {
				interface: 'system-scope',
				width: 'half',
			},
		},
		{
			field: 'layout',
			name: '$t:layout',
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
			field: 'search',
			name: '$t:search',
			type: 'string',
			meta: {
				interface: 'input',
				width: 'half',
				options: {
					placeholder: '$t:search_items',
				},
			},
		},
		{
			field: 'filter',
			name: '$t:filter',
			type: 'json',
			meta: {
				interface: 'system-filter',
				options: {
					collectionField: 'collection',
					rawFieldNames: true,
				},
			},
		},
		{
			field: 'layout-divider',
			name: '$t:divider',
			type: 'alias',
			meta: {
				interface: 'presentation-divider',
				width: 'fill',
				options: {
					title: '$t:layout_preview',
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
</script>

<template>
	<component
		:is="layoutWrapper"
		v-slot="{ layoutState }"
		v-model:layout-options="layoutOptions"
		v-model:layout-query="layoutQuery"
		:layout-props="layoutProps"
		:filter="layoutFilter"
		:search="search"
		:collection="values.collection"
		readonly
	>
		<private-view :title="$t('editing_preset')" show-back>
			<template #headline>
				<v-breadcrumb :items="[{ name: $t('settings_presets'), to: '/settings/presets' }]" />
			</template>

			<template #navigation>
				<settings-navigation />
			</template>

			<template #actions>
				<v-dialog v-model="confirmDelete" @esc="confirmDelete = false" @apply="deleteAndQuit">
					<template #activator="{ on }">
						<v-button
							v-tooltip.bottom="$t('delete_label')"
							rounded
							icon
							class="action-delete"
							secondary
							:disabled="preset === null || id === '+'"
							small
							@click="on"
						>
							<v-icon name="delete" small />
						</v-button>
					</template>

					<v-card>
						<v-card-title>{{ $t('delete_are_you_sure') }}</v-card-title>

						<v-card-actions>
							<v-button secondary @click="confirmDelete = false">
								{{ $t('cancel') }}
							</v-button>
							<v-button kind="danger" :loading="deleting" @click="deleteAndQuit">
								{{ $t('delete_label') }}
							</v-button>
						</v-card-actions>
					</v-card>
				</v-dialog>

				<v-button
					v-tooltip.bottom="$t('save')"
					icon
					rounded
					:disabled="hasEdits === false"
					:loading="saving"
					small
					@click="save"
				>
					<v-icon name="check" small />
				</v-button>
			</template>

			<div class="preset-item">
				<v-form v-model="edits" :fields="fields" :loading="loading" :initial-values="initialValues" :primary-key="id" />

				<div class="layout">
					<component :is="`layout-${values.layout}`" v-if="values.layout && values.collection" v-bind="layoutState">
						<template #no-results>
							<v-info :title="$t('no_results')" icon="search" center>
								{{ $t('no_results_copy') }}
							</v-info>
						</template>

						<template #no-items>
							<v-info :title="$t('item_count', 0)" center>
								{{ $t('no_items_copy') }}
							</v-info>
						</template>
					</component>

					<v-notice v-else>
						{{ $t('no_layout_collection_selected_yet') }}
					</v-notice>
				</div>
			</div>

			<template #sidebar>
				<sidebar-detail icon="info" :title="$t('information')" close>
					<div v-md="$t('page_help_settings_presets_item')" class="page-description" />
				</sidebar-detail>

				<div class="layout-sidebar">
					<component
						:is="`layout-sidebar-${values.layout}`"
						v-if="values.layout && values.collection"
						v-bind="layoutState"
					/>

					<sidebar-detail icon="layers" :title="$t('layout_options')">
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

			<v-dialog v-model="confirmLeave" @esc="confirmLeave = false" @apply="discardAndLeave">
				<v-card>
					<v-card-title>{{ $t('unsaved_changes') }}</v-card-title>
					<v-card-text>{{ $t('unsaved_changes_copy') }}</v-card-text>
					<v-card-actions>
						<v-button secondary @click="discardAndLeave">
							{{ $t('discard_changes') }}
						</v-button>
						<v-button @click="confirmLeave = false">{{ $t('keep_editing') }}</v-button>
					</v-card-actions>
				</v-card>
			</v-dialog>
		</private-view>
	</component>
</template>

<style lang="scss" scoped>
@use '@/styles/mixins';

.header-icon {
	--v-button-background-color: var(--theme--primary-background);
	--v-button-color: var(--theme--primary);
	--v-button-background-color-hover: var(--theme--primary-subdued);
	--v-button-color-hover: var(--theme--primary);
}

.action-delete {
	--v-button-background-color-hover: var(--theme--danger) !important;
	--v-button-color-hover: var(--white) !important;
}

.preset-item {
	padding: var(--content-padding);
}

.layout {
	--content-padding: 0px;
	--content-padding-bottom: 0px;
	--layout-offset-top: 0;

	position: relative;
	inline-size: 100%;
	margin-block-start: 32px;

	:deep(#map-container) {
		min-block-size: 360px;
	}
}

.layout-sidebar {
	--theme--form--row-gap: 24px;

	display: contents;
}

:deep(.layout-options) {
	--theme--form--row-gap: 24px;

	@include mixins.form-grid;
}

:deep(.layout-options .type-label) {
	font-size: 1rem;
}

.subdued {
	color: var(--theme--foreground-subdued);
	font-style: italic;
}
</style>
