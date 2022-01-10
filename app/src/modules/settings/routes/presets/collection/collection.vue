<template>
	<private-view :title="t('settings_presets')">
		<template #headline><v-breadcrumb :items="[{ name: t('settings'), to: '/settings' }]" /></template>

		<template #title-outer:prepend>
			<v-button class="header-icon" rounded disabled icon secondary>
				<v-icon name="bookmark_border" />
			</v-button>
		</template>

		<template #actions>
			<v-dialog v-if="selection.length > 0" v-model="confirmDelete" @esc="confirmDelete = false">
				<template #activator="{ on }">
					<v-button v-tooltip.bottom="t('delete_label')" rounded icon class="action-delete" @click="on">
						<v-icon name="delete" outline />
					</v-button>
				</template>

				<v-card>
					<v-card-title>{{ t('batch_delete_confirm', selection.length) }}</v-card-title>

					<v-card-actions>
						<v-button secondary @click="confirmDelete = false">
							{{ t('cancel') }}
						</v-button>
						<v-button kind="danger" :loading="deleting" @click="deleteSelection">
							{{ t('delete_label') }}
						</v-button>
					</v-card-actions>
				</v-card>
			</v-dialog>

			<v-button v-tooltip.bottom="t('create_preset')" rounded icon :to="addNewLink">
				<v-icon name="add" />
			</v-button>
		</template>

		<template #navigation>
			<settings-navigation />
		</template>

		<div class="presets-collection">
			<v-info v-if="!loading && presets.length === 0" center type="warning" :title="t('no_presets')" icon="bookmark">
				{{ t('no_presets_copy') }}

				<template #append>
					<v-button :to="addNewLink">
						{{ t('no_presets_cta') }}
					</v-button>
				</template>
			</v-info>
			<v-table
				v-else
				v-model="selection"
				:headers="headers"
				fixed-header
				:items="presets"
				:loading="loading"
				show-select="multiple"
				@click:row="onRowClick"
			>
				<template #[`item.scope`]="{ item }">
					<span :class="{ all: item.scope === 'all' }">
						{{ item.scope === 'all' ? t('all') : item.scope }}
					</span>
				</template>

				<template #[`item.layout`]="{ item }">
					<value-null v-if="!item.layout" />
					<span v-else>{{ item.layout }}</span>
				</template>

				<template #[`item.name`]="{ item }">
					<span :class="{ default: item.name === null }">
						{{ item.name === null ? t('default_label') : item.name }}
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
import { useI18n } from 'vue-i18n';
import { defineComponent, computed, ref } from 'vue';
import SettingsNavigation from '../../../components/navigation.vue';

import api from '@/api';
import { Header } from '@/components/v-table/types';
import { useCollectionsStore, usePresetsStore } from '@/stores/';
import { getLayout } from '@/layouts';
import { useRouter } from 'vue-router';
import ValueNull from '@/views/private/components/value-null';
import PresetsInfoSidebarDetail from './components/presets-info-sidebar-detail.vue';
import { userName } from '@/utils/user-name';
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
	name: null | string;
	scope: string;
	collection: string;
	layout: string;
};

export default defineComponent({
	components: { SettingsNavigation, ValueNull, PresetsInfoSidebarDetail },
	setup() {
		const { t } = useI18n();

		const router = useRouter();

		const collectionsStore = useCollectionsStore();

		const selection = ref<Preset[]>([]);

		const { addNewLink } = useLinks();
		const { loading, presets, getPresets } = usePresets();
		const { headers } = useTable();
		const { confirmDelete, deleting, deleteSelection } = useDelete();
		const presetsStore = usePresetsStore();

		getPresets();

		return {
			t,
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
					const layout = getLayout(preset.layout)?.name;

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
				} catch (err: any) {
					unexpectedError(err);
				} finally {
					loading.value = false;
				}
			}
		}

		function useTable() {
			const headers: Header[] = [
				{
					text: t('collection'),
					value: 'collection',
					align: 'left',
					sortable: true,
					width: 200,
				},
				{
					text: t('scope'),
					value: 'scope',
					align: 'left',
					sortable: true,
					width: 200,
				},
				{
					text: t('layout'),
					value: 'layout',
					align: 'left',
					sortable: true,
					width: 200,
				},
				{
					text: t('name'),
					value: 'name',
					align: 'left',
					sortable: true,
					width: 200,
				},
			];

			return { headers };
		}

		function onRowClick({ item }: { item: Preset }) {
			// This ensures that the type signature the item matches the ones in selection
			item = ref(item).value;

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
					await presetsStore.delete(IDs);
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
