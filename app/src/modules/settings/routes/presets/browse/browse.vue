<template>
	<private-view :title="$t('settings_presets')">
		<template #headline>{{ $t('settings') }}</template>

		<template #title-outer:prepend>
			<v-button class="header-icon" rounded disabled icon secondary>
				<v-icon name="bookmark" />
			</v-button>
		</template>

		<template #actions>
			<v-dialog v-model="confirmDelete" v-if="selection.length > 0">
				<template #activator="{ on }">
					<v-button rounded icon class="action-delete" @click="on" v-tooltip.bottom="$t('delete')">
						<v-icon name="delete" />
					</v-button>
				</template>

				<v-card>
					<v-card-title>{{ $tc('batch_delete_confirm', selection.length) }}</v-card-title>

					<v-card-actions>
						<v-button @click="confirmDelete = false" secondary>
							{{ $t('cancel') }}
						</v-button>
						<v-button @click="deleteSelection" class="action-delete" :loading="deleting">
							{{ $t('delete') }}
						</v-button>
					</v-card-actions>
				</v-card>
			</v-dialog>

			<v-button rounded icon :to="addNewLink" v-tooltip.bottom="$t('create_preset')">
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
				v-if="!loading && presets.length === 0"
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

		<template #drawer>
			<presets-info-drawer-detail />
			<drawer-detail icon="help_outline" :title="$t('help_and_docs')">
				<div class="format-markdown" v-html="marked($t('page_help_settings_presets_browse'))" />
			</drawer-detail>
		</template>
	</private-view>
</template>

<script lang="ts">
import { defineComponent, computed, ref } from '@vue/composition-api';
import SettingsNavigation from '../../../components/navigation';

import api from '@/api';
import { Header } from '@/components/v-table/types';
import i18n from '@/lang';
import { useCollectionsStore } from '@/stores/';
import layouts from '@/layouts';
import { TranslateResult } from 'vue-i18n';
import router from '@/router';
import ValueNull from '@/views/private/components/value-null';
import marked from 'marked';
import PresetsInfoDrawerDetail from './components/presets-info-drawer-detail.vue';

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
	components: { SettingsNavigation, ValueNull, PresetsInfoDrawerDetail },
	setup() {
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
			marked,
		};

		function useLinks() {
			const addNewLink = computed(() => {
				return `/settings/presets/+`;
			});

			return { addNewLink };
		}

		function usePresets() {
			const loading = ref(false);
			const presetsRaw = ref<PresetRaw[] | null>(null);
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
				loading.value = true;

				try {
					const response = await api.get(`/presets`, {
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
							limit: -1,
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
			if (selection.value.length === 0) {
				router.push(`/settings/presets/${item.id}`);
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
				deleting.value = true;

				try {
					const IDs = selection.value.map((item) => item.id).join(',');
					await api.delete(`/presets/${IDs}`);
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
