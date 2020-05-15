<template>
	<private-view :title="$t('settings_presets')">
		<template #title-outer:prepend>
			<v-button class="header-icon" rounded disabled icon secondary>
				<v-icon name="bookmark" />
			</v-button>
		</template>

		<template #actions>
			<v-dialog v-model="confirmDelete" v-if="selection.length > 0">
				<template #activator="{ on }">
					<v-button rounded icon class="action-delete" @click="on">
						<v-icon name="delete" />
					</v-button>
				</template>

				<v-card>
					<v-card-title>{{ $tc('batch_delete_confirm', selection.length) }}</v-card-title>

					<v-card-actions>
						<v-button @click="confirmDelete = false" secondary>
							{{ $t('cancel') }}
						</v-button>
						<v-button
							@click="deleteSelection"
							class="action-delete"
							:loading="deleting"
						>
							{{ $t('delete') }}
						</v-button>
					</v-card-actions>
				</v-card>
			</v-dialog>

			<v-button rounded icon :to="addNewLink">
				<v-icon name="add" />
			</v-button>
		</template>

		<template #navigation>
			<settings-navigation />
		</template>

		<div class="presets-browse">
			<v-info
				center
				type="warning"
				v-if="presets.length === 0"
				:title="$t('no_presets')"
				icon="bookmark"
			>
				{{ $t('no_presets_copy') }}

				<template #append>
					<v-button :to="addNewLink">
						{{ $t('no_presets_cta') }}
					</v-button>
				</template>
			</v-info>
			<v-table
				:headers="headers"
				fixed-header
				:items="presets"
				:loading="loading"
				@click:row="onRowClick"
				v-model="selection"
				show-select
				v-else
			>
				<template #item.scope="{ item }">
					<span :class="{ all: item.scope === 'all' }">
						{{ item.scope === 'all' ? $t('all') : item.scope }}
					</span>
				</template>

				<template #item.layout="{ item }">
					<value-null v-if="!item.layout" />
					<span v-else>{{ item.layout }}</span>
				</template>

				<template #item.name="{ item }">
					<span :class="{ default: item.name === null }">
						{{ item.name === null ? $t('default') : item.name }}
					</span>
				</template>
			</v-table>
		</div>
	</private-view>
</template>

<script lang="ts">
import { defineComponent, computed, ref } from '@vue/composition-api';
import SettingsNavigation from '../../../components/navigation';
import useProjectsStore from '@/stores/projects';
import api from '@/api';
import { Header } from '@/components/v-table/types';
import i18n from '@/lang';
import useCollectionsStore from '@/stores/collections';
import layouts from '@/layouts';
import { TranslateResult } from 'vue-i18n';
import router from '@/router';
import ValueNull from '@/views/private/components/value-null';

type PresetRaw = {
	id: number;
	title: null | string;
	user: null | { first_name: string; last_name: string };
	role: null | { name: string };
	collection: string;
	view_type: string;
};

type Preset = {
	id: number;
	name: null | string | TranslateResult;
	scope: string;
	collection: string | TranslateResult;
	layout: string | TranslateResult;
};

export default defineComponent({
	components: { SettingsNavigation, ValueNull },
	setup() {
		const projectsStore = useProjectsStore();
		const collectionsStore = useCollectionsStore();

		const selection = ref<Preset[]>([]);

		const { addNewLink } = useLinks();
		const { loading, presets, error, getPresets } = usePresets();
		const { headers } = useTable();
		const { confirmDelete, deleting, deleteSelection } = useDelete();

		getPresets();

		return {
			addNewLink,
			usePresets,
			loading,
			presets,
			error,
			getPresets,
			headers,
			selection,
			onRowClick,
			confirmDelete,
			deleting,
			deleteSelection,
		};

		function useLinks() {
			const addNewLink = computed(() => {
				const { currentProjectKey } = projectsStore.state;
				return `/${currentProjectKey}/settings/presets/+`;
			});

			return { addNewLink };
		}

		function usePresets() {
			const loading = ref(false);
			const presetsRaw = ref<PresetRaw[]>(null);
			const error = ref(null);

			const presets = computed<Preset[]>(() => {
				return (presetsRaw.value || []).map((preset) => {
					let scope = 'all';

					if (preset.role) {
						scope = preset.role.name;
					}

					if (preset.user) {
						scope = `${preset.user.first_name} ${preset.user.last_name}`;
					}

					const collection = collectionsStore.getCollection(preset.collection)?.name;
					const layout = layouts.find((l) => l.id === preset.view_type)?.name;

					return {
						id: preset.id,
						scope: scope,
						collection: collection,
						layout: layout,
						name: preset.title,
					} as Preset;
				});
			});

			return { loading, presetsRaw, error, getPresets, presets };

			async function getPresets() {
				const { currentProjectKey } = projectsStore.state;

				loading.value = true;

				try {
					const response = await api.get(`/${currentProjectKey}/collection_presets`, {
						params: {
							fields: [
								'id',
								'title',
								'user.first_name',
								'user.last_name',
								'role.name',
								'collection',
								'view_type',
							],
						},
					});
					presetsRaw.value = response.data.data;
				} catch (err) {
					error.value = err;
				} finally {
					loading.value = false;
				}
			}
		}

		function useTable() {
			const headers: Header[] = [
				{
					text: i18n.t('collection'),
					value: 'collection',
					align: 'left',
					sortable: true,
					width: 200,
				},
				{
					text: i18n.t('scope'),
					value: 'scope',
					align: 'left',
					sortable: true,
					width: 200,
				},
				{
					text: i18n.t('layout'),
					value: 'layout',
					align: 'left',
					sortable: true,
					width: 200,
				},
				{
					text: i18n.t('name'),
					value: 'name',
					align: 'left',
					sortable: true,
					width: 200,
				},
			];

			return { headers };
		}

		function onRowClick(item: Preset) {
			const { currentProjectKey } = projectsStore.state;
			if (selection.value.length === 0) {
				router.push(`/${currentProjectKey}/settings/presets/${item.id}`);
			} else {
				if (selection.value.includes(item)) {
					selection.value = selection.value.filter((i) => i !== item);
				} else {
					selection.value = [...selection.value, item];
				}
			}
		}

		function useDelete() {
			const confirmDelete = ref(false);
			const deleting = ref(false);

			return { confirmDelete, deleting, deleteSelection };

			async function deleteSelection() {
				const { currentProjectKey } = projectsStore.state;
				deleting.value = true;

				try {
					const IDs = selection.value.map((item) => item.id).join(',');
					await api.delete(`/${currentProjectKey}/collection_presets/${IDs}`);
					selection.value = [];
					await getPresets();
					confirmDelete.value = false;
				} finally {
					deleting.value = false;
				}
			}
		}
	},
});
</script>

<style lang="scss" scoped>
.header-icon {
	--v-button-color-disabled: var(--warning);
	--v-button-background-color-disabled: var(--warning-25);
}

.action-delete {
	--v-button-background-color: var(--danger-25);
	--v-button-color: var(--danger);
	--v-button-background-color-hover: var(--danger-50);
	--v-button-color-hover: var(--danger);
}

.presets-browse {
	padding: var(--content-padding);
	padding-top: 0;
}

.all {
	color: var(--primary);
}

.default {
	color: var(--foreground-subdued);
}
</style>
