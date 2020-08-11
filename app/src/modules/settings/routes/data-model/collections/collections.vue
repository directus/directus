<template>
	<private-view :title="$t('settings_data_model')">
		<template #headline>{{ $t('settings') }}</template>

		<template #title-outer:prepend>
			<v-button class="header-icon" rounded disabled icon secondary>
				<v-icon name="list_alt" />
			</v-button>
		</template>

		<template #actions>
			<v-button rounded icon to="/settings/data-model/+" v-tooltip.bottom="$t('create_collection')">
				<v-icon name="add" />
			</v-button>
		</template>

		<template #navigation>
			<settings-navigation />
		</template>

		<div class="padding-box">
			<v-info type="warning" icon="box" :title="$t('no_collections')" v-if="items.length === 0" center>
				{{ $t('no_collections_copy_admin') }}

				<template #append>
					<v-button to="/settings/data-model/+">{{ $t('create_collection') }}</v-button>
				</template>
			</v-info>

			<v-table
				v-else
				:headers.sync="tableHeaders"
				:items="items"
				@click:row="openCollection"
				show-resize
				fixed-header
				item-key="collection"
			>
				<template #item.icon="{ item }">
					<v-icon
						class="icon"
						:class="{
							hidden: item.hidden,
							meta: item.collection.startsWith('directus_'),
							unmanaged: item.managed === false && item.collection.startsWith('directus_') === false,
						}"
						:name="item.icon"
					/>
				</template>

				<template #item.name="{ item }">
					<span
						class="collection"
						:class="{
							hidden: item.hidden,
							meta: item.collection.startsWith('directus_'),
							unmanaged: item.managed === false && item.collection.startsWith('directus_') === false,
						}"
					>
						{{ item.name }}
					</span>
				</template>

				<template #item.note="{ item }">
					<span class="note" :class="{ hidden: item.hidden }">
						{{ item.note }}
					</span>
				</template>

				<template #item-append="{ item }">
					<collection-options :collection="item" />
				</template>
			</v-table>
		</div>

		<router-view name="add" />

		<template #drawer>
			<drawer-detail icon="info_outline" :title="$t('information')" close>
				<div class="format-markdown" v-html="marked($t('page_help_settings_datamodel_collections'))" />
			</drawer-detail>
			<collections-filter v-model="activeTypes" />
			<drawer-detail icon="help_outline" :title="$t('help_and_docs')">
				<div class="format-markdown" v-html="marked($t('page_help_settings_datamodel_collections'))" />
			</drawer-detail>
		</template>
	</private-view>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from '@vue/composition-api';
import SettingsNavigation from '../../../components/navigation/';
import { HeaderRaw } from '../../../../../components/v-table/types';
import { i18n } from '@/lang/';
import { useCollectionsStore } from '@/stores/';
import { Collection } from '@/types';
import router from '@/router';
import { sortBy } from 'lodash';
import CollectionOptions from './components/collection-options';
import CollectionsFilter from './components/collections-filter';
import marked from 'marked';

export default defineComponent({
	components: { SettingsNavigation, CollectionOptions, CollectionsFilter },
	setup() {
		const activeTypes = ref(['visible', 'hidden', 'unmanaged']);

		const collectionsStore = useCollectionsStore();

		const tableHeaders = ref<HeaderRaw[]>([
			{
				text: '',
				value: 'icon',
				width: 42,
				sortable: false,
			},
			{
				text: i18n.t('name'),
				value: 'name',
				width: 300,
			},
			{
				text: i18n.t('note'),
				value: 'note',
			},
		]);

		function openCollection({ collection }: Collection) {
			router.push(`/settings/data-model/${collection}`);
		}

		const { items } = useItems();

		return {
			tableHeaders,
			items,
			openCollection,
			activeTypes,
			marked,
		};

		function useItems() {
			const visible = computed(() => {
				return sortBy(
					collectionsStore.state.collections.filter(
						(collection) =>
							collection.collection.startsWith('directus_') === false && collection.meta?.hidden === false
					),
					'collection'
				);
			});

			const hidden = computed(() => {
				return sortBy(
					collectionsStore.state.collections
						.filter(
							(collection) =>
								collection.collection.startsWith('directus_') === false &&
								collection.meta?.hidden === true
						)
						.map((collection) => ({ ...collection, icon: 'visibility_off' })),
					'collection'
				);
			});

			const meta = computed(() => {
				return sortBy(
					collectionsStore.state.collections
						.filter((collection) => collection.collection.startsWith('directus_') === true)
						.map((collection) => ({ ...collection, icon: 'settings' })),
					'collection'
				);
			});

			const unmanaged = computed(() => {
				return sortBy(
					collectionsStore.state.collections
						.filter((collection) => collection.collection.startsWith('directus_') === false)
						.filter((collection) => collection.meta === null),
					'collection'
				);
			});

			const items = computed(() => {
				const items = [];

				if (activeTypes.value.includes('visible')) {
					items.push(visible.value);
				}

				if (activeTypes.value.includes('hidden')) {
					items.push(hidden.value);
				}

				if (activeTypes.value.includes('unmanaged')) {
					items.push(unmanaged.value);
				}

				if (activeTypes.value.includes('meta')) {
					items.push(meta.value);
				}

				return items.flat();
			});

			return { items };
		}
	},
});
</script>

<style lang="scss" scoped>
.icon ::v-deep i {
	vertical-align: baseline;
}

.hidden {
	color: var(--foreground-subdued);
}

.meta {
	color: var(--primary);
}

.unmanaged {
	color: var(--warning);
}

.padding-box {
	padding: var(--content-padding);
	padding-top: 0;
}

.v-table {
	--v-table-sticky-offset-top: 64px;

	display: contents;
}

.header-icon {
	--v-button-color-disabled: var(--warning);
	--v-button-background-color-disabled: var(--warning-25);
}
</style>
