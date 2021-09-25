<template>
	<private-view :title="t('settings_data_model')">
		<template #headline>{{ t('settings') }}</template>

		<template #title-outer:prepend>
			<v-button class="header-icon" rounded disabled icon secondary>
				<v-icon name="list_alt" />
			</v-button>
		</template>

		<template #actions>
			<v-button v-tooltip.bottom="t('create_collection')" rounded icon to="/settings/data-model/+">
				<v-icon name="add" />
			</v-button>
		</template>

		<template #navigation>
			<settings-navigation />
		</template>

		<div class="padding-box">
			<v-info v-if="collections.length === 0" type="warning" icon="box" :title="t('no_collections')" center>
				{{ t('no_collections_copy_admin') }}

				<template #append>
					<v-button to="/settings/data-model/+">{{ t('create_collection') }}</v-button>
				</template>
			</v-info>

			<v-list v-else>
				<draggable
					:animation="150"
					:force-fallback="true"
					:model-value="collections"
					item-key="collection"
					handle=".drag-handle"
					@update:model-value="onSort"
				>
					<template #item="{ element }">
						<v-list-item class="collection-row" block clickable :class="{ hidden: element.meta?.hidden }">
							<v-list-item-icon>
								<v-icon class="drag-handle" name="drag_handle" />
							</v-list-item-icon>
							<div class="collection-name" @click="openCollection(element)">
								<v-icon
									:color="element.meta?.hidden ? 'var(--foreground-subdued)' : element.color"
									class="collection-icon"
									:name="element.meta?.hidden ? 'visibility_off' : element.icon"
								/>
								<span class="collection-name">{{ element.name }}</span>
							</div>
							<collection-options :collection="element" />
						</v-list-item>
					</template>
				</draggable>
			</v-list>

			<v-list>
				<v-list-item
					v-for="collection of tableCollections"
					:key="collection.collection"
					class="collection-row hidden"
					block
					clickable
					@click="openCollection(collection)"
				>
					<v-list-item-icon>
						<v-icon name="add" />
					</v-list-item-icon>

					<div class="collection-name">
						<v-icon class="collection-icon" name="dns" />
						<span class="collection-name">{{ collection.name }}</span>
					</div>

					<collection-options :collection="collection" />
				</v-list-item>
			</v-list>
		</div>

		<router-view name="add" />

		<template #sidebar>
			<sidebar-detail icon="info_outline" :title="t('information')" close>
				<div v-md="t('page_help_settings_datamodel_collections')" class="page-description" />
			</sidebar-detail>
		</template>
	</private-view>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, computed } from 'vue';
import SettingsNavigation from '../../../components/navigation.vue';
import { useCollectionsStore } from '@/stores/';
import { Collection } from '@/types';
import { useRouter } from 'vue-router';
import { sortBy, merge } from 'lodash';
import CollectionOptions from './components/collection-options.vue';
import { translate } from '@/utils/translate-object-values';
import Draggable from 'vuedraggable';
import { unexpectedError } from '@/utils/unexpected-error';
import api from '@/api';

export default defineComponent({
	components: { SettingsNavigation, CollectionOptions, Draggable },
	setup() {
		const { t } = useI18n();

		const router = useRouter();

		const collectionsStore = useCollectionsStore();

		const collections = computed(() => {
			return translate(
				sortBy(
					collectionsStore.collections.filter(
						(collection) => collection.collection.startsWith('directus_') === false && collection.meta
					),
					['meta.sort', 'collection']
				)
			);
		});

		const tableCollections = computed(() => {
			return translate(
				sortBy(
					collectionsStore.collections.filter(
						(collection) =>
							collection.collection.startsWith('directus_') === false &&
							!!collection.meta === false &&
							collection.schema
					),
					['meta.sort', 'collection']
				)
			);
		});

		const systemCollections = computed(() => {
			return translate(
				sortBy(
					collectionsStore.collections
						.filter((collection) => collection.collection.startsWith('directus_') === true)
						.map((collection) => ({ ...collection, icon: 'settings' })),
					'collection'
				)
			);
		});

		return { t, collections, tableCollections, systemCollections, openCollection, onSort };

		function openCollection({ collection }: Collection) {
			router.push(`/settings/data-model/${collection}`);
		}

		async function onSort(newValue: Collection[]) {
			const valueWithSortValues = newValue.map((collection, index) => merge(collection, { meta: { sort: index + 1 } }));

			collectionsStore.collections = collectionsStore.collections.map((collection) => {
				const updated = valueWithSortValues.find(
					(updatedCollection) => updatedCollection.collection === collection.collection
				);

				return updated || collection;
			});

			try {
				await Promise.all(
					valueWithSortValues.map((collection) =>
						api.patch(`/collections/${collection.collection}`, { meta: { sort: collection.meta.sort } })
					)
				);
			} catch (err) {
				unexpectedError(err);
			}
		}
	},
});
</script>

<style scoped>
.collection-row.hidden {
	--v-list-item-color: var(--foreground-subdued);
}

.collection-name {
	flex-grow: 1;
	font-family: var(--family-monospace);
}

.collection-icon {
	margin-right: 8px;
}

.drag-handle {
	cursor: grab;
}

.hidden {
	color: var(--foreground-subdued);
}

.system {
	color: var(--primary);
}

.note {
	color: var(--foreground-subdued);
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
	--v-button-background-color-disabled: var(--warning-10);
}

.no-meta {
	--v-icon-color: var(--warning);

	margin-right: 4px;
}
</style>
