<template>
	<private-view :title="$t('settings_presets')">
		<template #headline>{{ $t('settings') }}</template>

		<template #title-outer:prepend>
			<v-button class="header-icon" rounded disabled icon secondary>
				<v-icon name="bookmark_border" />
			</v-button>
		</template>

		<template #actions>
			<v-dialog v-model="confirmDelete" v-if="selection.length > 0" @esc="confirmDelete = false">
				<template #activator="{ on }">
					<v-button rounded icon class="action-delete" @click="on" v-tooltip.bottom="$t('delete')">
						<v-icon name="delete" outline />
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

		<div class="presets-collection">
			<v-info center type="warning" v-if="!loading && presets.length === 0" :title="$t('no_presets')" icon="bookmark">
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

		<template #sidebar>
			<presets-info-sidebar-detail />
		</template>
	</private-view>
</template>

<script lang="ts">
import { defineComponent, computed, ref } from '@vue/composition-api';
import SettingsNavigation from '../../../components/navigation.vue';

import api from '@/api';
import { Header } from '@/components/v-table/types';
import { useCollectionsStore } from '@/stores/';
import { getLayouts } from '@/layouts';
import { TranslateResult } from 'vue-i18n';
import router from '@/router';
import ValueNull from '@/views/private/components/value-null';
import PresetsInfoSidebarDetail from './components/presets-info-sidebar-detail.vue';
import { userName } from '@/utils/user-name';
import i18n from '@/lang';
import { unexpectedError } from '@/utils/unexpected-error';

type PresetRaw = {
	id: number;
	bookmark: null | string;
	user: null | { email: string; first_name: string; last_name: string };
	role: null | { name: string };
	collection: string;
	layout: string;
};

type Preset = {
	id: number;
	name: null | string | TranslateResult;
	scope: string;
	collection: string | TranslateResult;
	layout: string | TranslateResult;
};

export default defineComponent({
	components: { SettingsNavigation, ValueNull, PresetsInfoSidebarDetail },
	setup() {
		const { layouts } = getLayouts();
		const collectionsStore = useCollectionsStore();

		const selection = ref<Preset[]>([]);

		const { addNewLink } = useLinks();
		const { loading, presets, getPresets } = usePresets();
		const { headers } = useTable();
		const { confirmDelete, deleting, deleteSelection } = useDelete();

		getPresets();

		return {
			addNewLink,
			usePresets,
			loading,
			presets,
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
				return `/settings/presets/+`;
			});

			return { addNewLink };
		}

		function usePresets() {
			const loading = ref(false);
			const presetsRaw = ref<PresetRaw[] | null>(null);

			const presets = computed<Preset[]>(() => {
				return (presetsRaw.value || []).map((preset) => {
					let scope = 'all';

					if (preset.role) {
						scope = preset.role.name;
					}

					if (preset.user) {
						scope = userName(preset.user);
					}

					const collection = collectionsStore.getCollection(preset.collection)?.name;
					const layout = layouts.value.find((l) => l.id === preset.layout)?.name;

					return {
						id: preset.id,
						scope: scope,
						collection: collection,
						layout: layout,
						name: preset.bookmark,
					} as Preset;
				});
			});

			return { loading, presetsRaw, getPresets, presets };

			async function getPresets() {
				loading.value = true;

				try {
					const response = await api.get(`/presets`, {
						params: {
							fields: [
								'id',
								'bookmark',
								'user.email',
								'user.first_name',
								'user.last_name',
								'role.name',
								'collection',
								'layout',
							],
							limit: -1,
						},
					});
					presetsRaw.value = response.data.data;
				} catch (err) {
					unexpectedError(err);
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
					const IDs = selection.value.map((item) => item.id);
					await api.delete(`/presets`, { data: IDs });
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
	--v-button-background-color-disabled: var(--warning-10);
}

.action-delete {
	--v-button-background-color: var(--danger-10);
	--v-button-color: var(--danger);
	--v-button-background-color-hover: var(--danger-25);
	--v-button-color-hover: var(--danger);
}

.presets-collection {
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
