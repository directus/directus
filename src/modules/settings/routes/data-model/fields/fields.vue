<template>
	<private-view :title="collectionInfo.name">
		<template #title-outer:prepend>
			<v-button class="header-icon" rounded disabled icon secondary>
				<v-icon name="list_alt" />
			</v-button>
		</template>

		<template #headline>
			<v-breadcrumb :items="breadcrumb" />
		</template>

		<template #actions>
			<v-dialog v-model="confirmDelete">
				<template #activator="{ on }">
					<v-button
						rounded
						icon
						class="action-delete"
						:disabled="item === null"
						@click="on"
					>
						<v-icon name="delete" />
					</v-button>
				</template>

				<v-card>
					<v-card-title>{{ $t('delete_are_you_sure') }}</v-card-title>

					<v-card-actions>
						<v-button @click="confirmDelete = false" secondary>
							{{ $t('cancel') }}
						</v-button>
						<v-button @click="deleteAndQuit" class="action-delete" :loading="deleting">
							{{ $t('delete') }}
						</v-button>
					</v-card-actions>
				</v-card>
			</v-dialog>

			<v-button
				rounded
				icon
				:loading="saving"
				:disabled="hasEdits === false"
				@click="saveAndQuit"
			>
				<v-icon name="check" />
			</v-button>
		</template>

		<template #navigation>
			<settings-navigation />
		</template>

		<div class="collections-detail">
			<div class="fields">
				<h2 class="title type-label">
					{{ $t('fields_and_layout') }}
					<span class="instant-save">{{ $t('saves_automatically') }}</span>
				</h2>
				<fields-management :collection="collection" />
			</div>

			<v-form
				collection="directus_collections"
				:loading="loading"
				:initial-values="item"
				:batch-mode="isBatch"
				v-model="edits"
			/>
		</div>
	</private-view>
</template>

<script lang="ts">
import { defineComponent, computed, toRefs, ref } from '@vue/composition-api';
import SettingsNavigation from '../../../components/navigation/';
import useCollection from '@/compositions/use-collection/';
import FieldsManagement from './components/fields-management';
import useProjectsStore from '@/stores/projects';
import { i18n } from '@/lang';
import useItem from '@/compositions/use-item';
import router from '@/router';
import useCollectionsStore from '@/stores/collections';

export default defineComponent({
	components: { SettingsNavigation, FieldsManagement },
	props: {
		collection: {
			type: String,
			required: true,
		},
	},
	setup(props) {
		const projectsStore = useProjectsStore();
		const { collection } = toRefs(props);
		const { info: collectionInfo, fields } = useCollection(collection);
		const { currentProjectKey } = toRefs(projectsStore.state);
		const collectionsStore = useCollectionsStore();

		const breadcrumb = computed(() => {
			return [
				{
					name: i18n.t('settings_data_model'),
					to: `/${projectsStore.state.currentProjectKey}/settings/data-model`,
				},
			];
		});

		const {
			isNew,
			edits,
			item,
			saving,
			loading,
			error,
			save,
			remove,
			deleting,
			saveAsCopy,
			isBatch,
		} = useItem(ref('directus_collections'), collection);

		const hasEdits = computed<boolean>(() => Object.keys(edits.value).length > 0);

		const confirmDelete = ref(false);

		return {
			collectionInfo,
			fields,
			breadcrumb,
			confirmDelete,
			isNew,
			edits,
			item,
			saving,
			loading,
			error,
			save,
			remove,
			deleting,
			saveAsCopy,
			isBatch,
			deleteAndQuit,
			saveAndQuit,
			hasEdits,
		};

		async function deleteAndQuit() {
			await remove();
			router.push(`/${currentProjectKey.value}/settings/data-model`);
		}

		async function saveAndQuit() {
			await save();
			await collectionsStore.hydrate();
			router.push(`/${currentProjectKey.value}/settings/data-model`);
		}
	},
});
</script>

<style lang="scss" scoped>
.title {
	margin-bottom: 12px;

	.instant-save {
		margin-left: 4px;
		color: var(--warning);
	}
}

.collections-detail {
	padding: var(--content-padding);
}

.fields {
	max-width: 800px;
	margin-bottom: 48px;
}

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
</style>
