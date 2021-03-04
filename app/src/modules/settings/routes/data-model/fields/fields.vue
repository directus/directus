<template>
	<private-view :title="collectionInfo && collectionInfo.name">
		<template #headline>{{ $t('settings_data_model') }}</template>
		<template #title-outer:prepend>
			<v-button class="header-icon" rounded icon exact to="/settings/data-model">
				<v-icon name="arrow_back" />
			</v-button>
		</template>

		<template #actions>
			<v-dialog v-model="confirmDelete" @esc="confirmDelete = false">
				<template #activator="{ on }">
					<v-button
						rounded
						icon
						class="action-delete"
						:disabled="item === null"
						@click="on"
						v-tooltip.bottom="$t('delete_collection')"
						v-if="item && item.collection.startsWith('directus_') === false"
					>
						<v-icon name="delete" outline />
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
				v-tooltip.bottom="$t('save')"
			>
				<v-icon name="check" />
			</v-button>
		</template>

		<template #navigation>
			<settings-navigation />
		</template>

		<div class="collections-item">
			<div class="fields">
				<h2 class="title type-label">
					{{ $t('fields_and_layout') }}
					<span class="instant-save">{{ $t('saves_automatically') }}</span>
				</h2>
				<fields-management :collection="collection" />
			</div>

			<router-view name="field" :collection="collection" :field="field" :type="type" />

			<v-form
				collection="directus_collections"
				:loading="loading"
				:initial-values="item && item.meta"
				:batch-mode="isBatch"
				:primary-key="collection"
				v-model="edits.meta"
				:disabled="item && item.collection.startsWith('directus_')"
			/>
		</div>

		<template #sidebar>
			<sidebar-detail icon="info_outline" :title="$t('information')" close>
				<div class="page-description" v-html="marked($t('page_help_settings_datamodel_fields'))" />
			</sidebar-detail>
		</template>
	</private-view>
</template>

<script lang="ts">
import { defineComponent, computed, toRefs, ref } from '@vue/composition-api';
import SettingsNavigation from '../../../components/navigation.vue';
import useCollection from '@/composables/use-collection/';
import FieldsManagement from './components/fields-management.vue';

import useItem from '@/composables/use-item';
import router from '@/router';
import { useCollectionsStore, useFieldsStore } from '@/stores';
import marked from 'marked';

export default defineComponent({
	components: { SettingsNavigation, FieldsManagement },
	props: {
		collection: {
			type: String,
			required: true,
		},

		// Field detail modal only
		field: {
			type: String,
			default: null,
		},
		type: {
			type: String,
			default: null,
		},
	},
	setup(props) {
		const { collection } = toRefs(props);
		const { info: collectionInfo, fields } = useCollection(collection);
		const collectionsStore = useCollectionsStore();
		const fieldsStore = useFieldsStore();

		const { isNew, edits, item, saving, loading, error, save, remove, deleting, saveAsCopy, isBatch } = useItem(
			ref('directus_collections'),
			collection
		);

		const hasEdits = computed<boolean>(() => Object.keys(edits.value).length > 0);

		const confirmDelete = ref(false);

		return {
			collectionInfo,
			fields,
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
			marked,
		};

		async function deleteAndQuit() {
			await remove();
			await collectionsStore.hydrate();
			await fieldsStore.hydrate();
			router.push(`/settings/data-model`);
		}

		async function saveAndQuit() {
			await save();
			await collectionsStore.hydrate();
			await fieldsStore.hydrate();
			router.push(`/settings/data-model`);
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

.collections-item {
	padding: var(--content-padding);
	padding-top: 0;
	padding-bottom: var(--content-padding-bottom);
}

.fields {
	max-width: 800px;
	margin-bottom: 48px;
}

.header-icon {
	--v-button-background-color: var(--warning-10);
	--v-button-color: var(--warning);
	--v-button-background-color-hover: var(--warning-25);
	--v-button-color-hover: var(--warning);
}

.action-delete {
	--v-button-background-color: var(--danger-10);
	--v-button-color: var(--danger);
	--v-button-background-color-hover: var(--danger-25);
	--v-button-color-hover: var(--danger);
}
</style>
