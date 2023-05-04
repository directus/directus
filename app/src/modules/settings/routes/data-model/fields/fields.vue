<template>
	<private-view :title="collectionInfo && collectionInfo.name">
		<template #headline>
			<v-breadcrumb :items="[{ name: t('settings_data_model'), to: '/settings/data-model' }]" />
		</template>
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
						secondary
						:disabled="item === null"
						@click="on"
					>
						<v-icon name="delete" />
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
			<sidebar-detail icon="info" :title="t('information')" close>
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

<script setup lang="ts">
import { useEditsGuard } from '@/composables/use-edits-guard';
import { useItem } from '@/composables/use-item';
import { useShortcut } from '@/composables/use-shortcut';
import { useCollectionsStore } from '@/stores/collections';
import { useFieldsStore } from '@/stores/fields';
import { useCollection } from '@directus/composables';
import { computed, ref, toRefs } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import SettingsNavigation from '../../../components/navigation.vue';
import FieldsManagement from './components/fields-management.vue';

const props = defineProps<{
	collection: string;
	// Field detail modal only
	field?: string;
	type?: string;
}>();

const { t } = useI18n();

const router = useRouter();

const { collection } = toRefs(props);
const { info: collectionInfo } = useCollection(collection);
const collectionsStore = useCollectionsStore();
const fieldsStore = useFieldsStore();

const { edits, item, saving, loading, save, remove, deleting, isBatch } = useItem(
	ref('directus_collections'),
	collection
);

const hasEdits = computed<boolean>(() => {
	if (!edits.value.meta) return false;
	return Object.keys(edits.value.meta).length > 0;
});

useShortcut('meta+s', () => {
	if (hasEdits.value) saveAndStay();
});

const confirmDelete = ref(false);

const { confirmLeave, leaveTo } = useEditsGuard(hasEdits);

async function deleteAndQuit() {
	await remove();
	await Promise.all([collectionsStore.hydrate(), fieldsStore.hydrate()]);
	edits.value = {};
	router.replace(`/settings/data-model`);
}

async function saveAndStay() {
	await save();
	await Promise.all([collectionsStore.hydrate(), fieldsStore.hydrate()]);
}

async function saveAndQuit() {
	await save();
	await Promise.all([collectionsStore.hydrate(), fieldsStore.hydrate()]);
	router.push(`/settings/data-model`);
}

function discardAndLeave() {
	if (!leaveTo.value) return;
	edits.value = {};
	confirmLeave.value = false;
	router.push(leaveTo.value);
}
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
	--v-button-background-color: var(--primary-10);
	--v-button-color: var(--primary);
	--v-button-background-color-hover: var(--primary-25);
	--v-button-color-hover: var(--primary);
}

.action-delete {
	--v-button-background-color-hover: var(--danger) !important;
	--v-button-color-hover: var(--white) !important;
}
</style>
