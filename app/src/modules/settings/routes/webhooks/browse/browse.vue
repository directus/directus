<template>
	<private-view :title="$t('webhooks')">
		<template #headline>{{ $t('settings') }}</template>

		<template #title-outer:prepend>
			<v-button class="header-icon" rounded disabled icon secondary>
				<v-icon name="send" />
			</v-button>
		</template>

		<template #navigation>
			<settings-navigation />
		</template>

		<!--
		<template #actions>
			<v-dialog v-model="confirmDelete">
				<template #activator="{ on }">
					<v-button rounded icon class="action-delete" v-if="selection.length > 0" @click="on">
						<v-icon name="delete" />
					</v-button>
				</template>

				<v-card>
					<v-card-title>{{ $tc('batch_delete_confirm', selection.length) }}</v-card-title>

					<v-card-actions>
						<v-button @click="confirmDelete = false" secondary>
							{{ $t('cancel') }}
						</v-button>
						<v-button @click="batchDelete" class="action-delete" :loading="deleting">
							{{ $t('delete') }}
						</v-button>
					</v-card-actions>
				</v-card>
			</v-dialog>

			<v-button rounded icon class="action-batch" v-if="selection.length > 1" :to="batchLink">
				<v-icon name="edit" />
			</v-button>

			<v-button rounded icon :to="addNewLink">
				<v-icon name="add" />
			</v-button>
		</template>

		<layout-tabular
			class="layout"
			ref="layout"
			collection="directus_webhooks"
			:selection.sync="selection"
			:view-options.sync="viewOptions"
			:view-query.sync="viewQuery"
		/> -->

		<div class="content">
			<v-notice>
				Pre-Release: Feature not yet available
			</v-notice>
		</div>

		<template #drawer>
			<drawer-detail icon="info_outline" :title="$t('information')" close>
				<div class="format-markdown" v-html="marked($t('page_help_settings_webhooks_browse'))" />
			</drawer-detail>
			<layout-drawer-detail />
			<portal-target name="drawer" />
			<drawer-detail icon="help_outline" :title="$t('help_and_docs')">
				<div class="format-markdown" v-html="marked($t('page_help_settings_webhooks_browse'))" />
			</drawer-detail>
		</template>
	</private-view>
</template>

<script lang="ts">
import { defineComponent, computed, ref } from '@vue/composition-api';
import SettingsNavigation from '../../../components/navigation/';

import { i18n } from '@/lang';
import api from '@/api';
import { LayoutComponent } from '@/layouts/types';
import usePreset from '@/composables/use-collection-preset';
import marked from 'marked';
import LayoutDrawerDetail from '@/views/private/components/layout-drawer-detail';

type Item = {
	[field: string]: any;
};

export default defineComponent({
	name: 'webhooks-browse',
	components: { SettingsNavigation, LayoutDrawerDetail },
	props: {},
	setup() {
		const layout = ref<LayoutComponent | null>(null);

		const selection = ref<Item[]>([]);

		const { viewType, viewOptions, viewQuery } = usePreset(ref('directus_webhooks'));
		const { addNewLink, batchLink } = useLinks();
		const { confirmDelete, deleting, batchDelete } = useBatchDelete();
		const { breadcrumb } = useBreadcrumb();

		if (viewType.value === null) {
			viewType.value = 'tabular';
		}

		if (viewOptions.value === null && viewType.value === 'tabular') {
			viewOptions.value = {
				widths: {
					status: 50,
					name: 120,
					directus_action: 180,
					collection: 220,
				},
			};
		}

		if (viewQuery.value === null && viewType.value === 'tabular') {
			viewQuery.value = {
				fields: ['status', 'name', 'directus_action', 'collection'],
			};
		}

		return {
			addNewLink,
			batchLink,
			selection,
			breadcrumb,
			confirmDelete,
			batchDelete,
			deleting,
			layout,
			viewOptions,
			viewQuery,
			marked,
		};

		function useBatchDelete() {
			const confirmDelete = ref(false);
			const deleting = ref(false);

			return { confirmDelete, deleting, batchDelete };

			async function batchDelete() {
				deleting.value = true;

				confirmDelete.value = false;

				const batchPrimaryKeys = selection.value.map((item) => item.id).join();

				await api.delete(`/settings/webhooks/${batchPrimaryKeys}`);

				await layout.value?.refresh();

				selection.value = [];
				deleting.value = false;
				confirmDelete.value = false;
			}
		}

		function useLinks() {
			const addNewLink = computed<string>(() => {
				return `/settings/webhooks/+`;
			});

			const batchLink = computed<string>(() => {
				const batchPrimaryKeys = selection.value.map((item) => item.id).join();
				return `/settings/webhooks/${batchPrimaryKeys}`;
			});

			return { addNewLink, batchLink };
		}

		function useBreadcrumb() {
			const breadcrumb = computed(() => {
				return [
					{
						name: i18n.tc('collection', 2),
						to: `/collections`,
					},
				];
			});

			return { breadcrumb };
		}
	},
});
</script>

<style lang="scss" scoped>
// .action-delete {
// 	--v-button-background-color: var(--danger-25);
// 	--v-button-color: var(--danger);
// 	--v-button-background-color-hover: var(--danger-50);
// 	--v-button-color-hover: var(--danger);
// }

// .action-batch {
// 	--v-button-background-color: var(--warning-25);
// 	--v-button-color: var(--warning);
// 	--v-button-background-color-hover: var(--warning-50);
// 	--v-button-color-hover: var(--warning);
// }

// .layout {
// 	--layout-offset-top: 64px;
// }

.header-icon {
	--v-button-color-disabled: var(--warning);
	--v-button-background-color-disabled: var(--warning-25);
}

.content {
	padding: var(--content-padding);
}
</style>
