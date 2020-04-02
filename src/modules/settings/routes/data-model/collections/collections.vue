<template>
	<private-view :title="$t('settings_data_model')">
		<template #title-outer:prepend>
			<v-button rounded disabled icon secondary>
				<v-icon name="account_tree" />
			</v-button>
		</template>

		<template #actions>
			<v-dialog v-model="addNewActive" persistent>
				<template #activator="{ on }">
					<v-button rounded icon @click="on">
						<v-icon name="add" />
					</v-button>
				</template>

				<new-collection @cancel="addNewActive = false" />
			</v-dialog>
		</template>

		<template #navigation>
			<settings-navigation />
		</template>

		<v-table
			:headers.sync="tableHeaders"
			:items="items"
			@click:row="openCollection"
			show-resize
		>
			<template #item.icon="{ item }">
				<v-icon class="icon" :class="{ hidden: item.hidden }" :name="item.icon" />
			</template>

			<template #item.collection="{ item }">
				<span class="collection" :class="{ hidden: item.hidden }">
					{{ item.collection }}
				</span>
			</template>

			<template #item.note="{ item }">
				<span class="note" :class="{ hidden: item.hidden }">
					{{ item.note }}
				</span>
			</template>
		</v-table>
	</private-view>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from '@vue/composition-api';
import SettingsNavigation from '../../../components/navigation/';
import NewCollection from './components/new-collection/';
import { HeaderRaw } from '../../../../../components/v-table/types';
import { i18n } from '@/lang/';
import useCollectionsStore from '@/stores/collections';
import { Collection } from '@/stores/collections/types';
import useProjectsStore from '@/stores/projects';
import router from '@/router';

export default defineComponent({
	components: { SettingsNavigation, NewCollection },
	setup() {
		const addNewActive = ref(false);
		const collectionsStore = useCollectionsStore();

		const tableHeaders = ref<HeaderRaw[]>([
			{
				text: '',
				value: 'icon',
				sortable: false,
			},
			{
				text: i18n.tc('collection', 0),
				value: 'collection',
			},
			{
				text: i18n.t('note'),
				value: 'note',
			},
		]);

		const items = computed(() => {
			return collectionsStore.state.collections.filter(
				({ collection }) => collection.startsWith('directus_') === false
			);
		});

		return { addNewActive, tableHeaders, items, openCollection };

		function openCollection({ collection }: Collection) {
			const { currentProjectKey } = useProjectsStore().state;
			router.push(`/${currentProjectKey}/settings/data-model/${collection}`);
		}
	},
});
</script>

<style lang="scss" scoped>
.collection {
	font-family: var(--family-monospace);
}

.icon ::v-deep i {
	vertical-align: baseline;
}

.hidden {
	color: var(--foreground-subdued);
}

.v-table {
	padding: var(--content-padding);
}
</style>
