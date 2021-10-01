<template>
	<private-view :title="collectionInfo && collectionInfo.name">
		<template #headline>{{ t('settings_data_model') }}</template>
		<template #title-outer:prepend>
			<v-button class="header-icon" rounded icon exact to="/settings/data-model">
				<v-icon name="arrow_back" />
			</v-button>
		</template>

		<template #actions>
			<v-dialog v-model="confirmDelete" @esc="confirmDelete = false">
				<template #activator="{ on }">
					<v-button
						v-if="item && item.collection.startsWith('directus_') === false"
						v-tooltip.bottom="t('delete_collection')"
						rounded
						icon
						class="action-delete"
						:disabled="item === null"
						@click="on"
					>
						<v-icon name="delete" outline />
					</v-button>
				</template>

				<v-card>
					<v-card-title>{{ t('delete_are_you_sure') }}</v-card-title>

					<v-card-actions>
						<v-button secondary @click="confirmDelete = false">
							{{ t('cancel') }}
						</v-button>
						<v-button kind="danger" :loading="deleting" @click="deleteAndQuit">
							{{ t('delete_label') }}
						</v-button>
					</v-card-actions>
				</v-card>
			</v-dialog>

			<v-button
				v-tooltip.bottom="t('save')"
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

		<div class="collections-item">
			<div class="fields">
				<h2 class="title type-label">
					{{ t('fields_and_layout') }}
					<span class="instant-save">{{ t('saves_automatically') }}</span>
				</h2>
				<fields-management :collection="collection" />
			</div>

			<router-view name="field" :collection="collection" :field="field" :type="type" />

			<v-form
				v-model="edits.meta"
				collection="directus_collections"
				:loading="loading"
				:initial-values="item && item.meta"
				:batch-mode="isBatch"
				:primary-key="collection"
				:disabled="item && item.collection.startsWith('directus_')"
			/>
		</div>

		<template #sidebar>
			<sidebar-detail icon="info_outline" :title="t('information')" close>
				<div v-md="t('page_help_settings_datamodel_fields')" class="page-description" />
			</sidebar-detail>
		</template>

		<v-dialog v-model="confirmLeave" @esc="confirmLeave = false">
			<v-card>
				<v-card-title>{{ t('unsaved_changes') }}</v-card-title>
				<v-card-text>{{ t('unsaved_changes_copy') }}</v-card-text>
				<v-card-actions>
					<v-button secondary @click="discardAndLeave">
						{{ t('discard_changes') }}
					</v-button>
					<v-button @click="confirmLeave = false">{{ t('keep_editing') }}</v-button>
				</v-card-actions>
			</v-card>
		</v-dialog>
	</private-view>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, computed, toRefs, ref } from 'vue';
import SettingsNavigation from '../../../components/navigation.vue';
import { useCollection } from '@directus/shared/composables';
import FieldsManagement from './components/fields-management.vue';

import useItem from '@/composables/use-item';
import { useRouter, onBeforeRouteUpdate, onBeforeRouteLeave, NavigationGuard } from 'vue-router';
import { useCollectionsStore, useFieldsStore } from '@/stores';
import useShortcut from '@/composables/use-shortcut';
import unsavedChanges from '@/composables/unsaved-changes';

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
		const { t } = useI18n();

		const router = useRouter();

		const { collection } = toRefs(props);
		const { info: collectionInfo, fields } = useCollection(collection);
		const collectionsStore = useCollectionsStore();
		const fieldsStore = useFieldsStore();

		const { isNew, edits, item, saving, loading, error, save, remove, deleting, saveAsCopy, isBatch } = useItem(
			ref('directus_collections'),
			collection
		);

		const hasEdits = computed<boolean>(() => Object.keys(edits.value).length > 0);

		useShortcut('meta+s', () => {
			if (hasEdits.value) saveAndStay();
		});

		const confirmDelete = ref(false);

		const isSavable = computed(() => {
			if (hasEdits.value === true) return true;
			return hasEdits.value;
		});

		unsavedChanges(isSavable);

		const confirmLeave = ref(false);
		const leaveTo = ref<string | null>(null);

		const editsGuard: NavigationGuard = (to) => {
			if (hasEdits.value) {
				confirmLeave.value = true;
				leaveTo.value = to.fullPath;
				return false;
			}
		};
		onBeforeRouteUpdate(editsGuard);
		onBeforeRouteLeave(editsGuard);

		return {
			t,
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
			isSavable,
			confirmLeave,
			leaveTo,
			discardAndLeave,
		};

		async function deleteAndQuit() {
			await remove();
			await collectionsStore.hydrate();
			await fieldsStore.hydrate();
			router.push(`/settings/data-model`);
		}

		async function saveAndStay() {
			await save();
			await collectionsStore.hydrate();
			await fieldsStore.hydrate();
		}

		async function saveAndQuit() {
			await save();
			await collectionsStore.hydrate();
			await fieldsStore.hydrate();
			router.push(`/settings/data-model`);
		}

		function discardAndLeave() {
			if (!leaveTo.value) return;
			edits.value = {};
			confirmLeave.value = false;
			router.push(leaveTo.value);
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
