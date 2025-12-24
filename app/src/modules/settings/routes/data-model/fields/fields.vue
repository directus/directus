<script setup lang="ts">
import VBreadcrumb from '@/components/v-breadcrumb.vue';
import VButton from '@/components/v-button.vue';
import VCardActions from '@/components/v-card-actions.vue';
import VCardText from '@/components/v-card-text.vue';
import VCardTitle from '@/components/v-card-title.vue';
import VCard from '@/components/v-card.vue';
import VCheckbox from '@/components/v-checkbox.vue';
import VDialog from '@/components/v-dialog.vue';
import VForm from '@/components/v-form/v-form.vue';
import { useEditsGuard } from '@/composables/use-edits-guard';
import { useItem } from '@/composables/use-item';
import { useShortcut } from '@/composables/use-shortcut';
import { useCollectionsStore } from '@/stores/collections';
import { useFieldsStore } from '@/stores/fields';
import { PrivateViewHeaderBarActionButton } from '@/views/private';
import { PrivateView } from '@/views/private';
import formatTitle from '@directus/format-title';
import { isSystemCollection } from '@directus/system-data';
import { computed, ref, toRefs, watch } from 'vue';
import { RouterView, useRouter } from 'vue-router';
import SettingsNavigation from '../../../components/navigation.vue';
import FieldsManagement from './components/fields-management.vue';
import api from '@/api';
import type { CollectionSnapshot } from '@directus/types';
import InterfaceInputCode from '@/interfaces/input-code/input-code.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VProgressCircular from '@/components/v-progress-circular.vue';
import VDivider from '@/components/v-divider.vue';

const props = defineProps<{
	collection: string;
	// Field detail modal only
	field?: string;
	type?: string;
}>();

const router = useRouter();

const { collection } = toRefs(props);
const collectionsStore = useCollectionsStore();
const fieldsStore = useFieldsStore();

const { edits, item, saving, loading, save, remove, deleting } = useItem(ref('directus_collections'), collection);

const hasEdits = computed<boolean>(() => {
	if (!edits.value.meta) return false;
	return Object.keys(edits.value.meta).length > 0;
});

useShortcut('meta+s', () => {
	if (hasEdits.value) saveAndStay();
});

const confirmDelete = ref(false);

const { confirmLeave, leaveTo } = useEditsGuard(hasEdits);

// View mode toggle (Visual or Code)
const viewMode = ref<'visual' | 'code'>('visual');
const collectionSnapshot = ref<CollectionSnapshot | null>(null);
const loadingSnapshot = ref(false);
const hideNulls = ref(false);

// Fetch collection snapshot when switching to code view
watch(viewMode, async (newMode) => {
	if (newMode === 'code' && !collectionSnapshot.value) {
		loadingSnapshot.value = true;
		try {
			const response = await api.get(`/schema/collections/${collection.value}`);
			collectionSnapshot.value = response.data.data;
		} catch (error) {
			console.error('Failed to fetch collection snapshot:', error);
		} finally {
			loadingSnapshot.value = false;
		}
	}
});

// Full JSON (always includes nulls)
const collectionSnapshotJSON = computed(() => {
	if (!collectionSnapshot.value) return '';
	return JSON.stringify(collectionSnapshot.value, null, 2);
});

// Display JSON (respects hideNulls setting)
const displaySnapshotJSON = computed(() => {
	if (!collectionSnapshot.value) return '';

	if (hideNulls.value) {
		return JSON.stringify(removeNullValues(collectionSnapshot.value), null, 2);
	}

	return collectionSnapshotJSON.value;
});

// Copy JSON to clipboard
function copyJSON() {
	navigator.clipboard.writeText(collectionSnapshotJSON.value);
}

// Remove null values recursively
function removeNullValues(obj: any): any {
	if (Array.isArray(obj)) {
		return obj.map(removeNullValues).filter(item => item !== null);
	}

	if (obj !== null && typeof obj === 'object') {
		return Object.entries(obj).reduce((acc, [key, value]) => {
			if (value === null) return acc;
			acc[key] = removeNullValues(value);
			return acc;
		}, {} as any);
	}

	return obj;
}

async function deleteAndQuit() {
	if (deleting.value) return;

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

<template>
	<PrivateView :title="formatTitle(collection)" show-back>
		<template #headline>
			<VBreadcrumb :items="[{ name: $t('settings_data_model'), to: '/settings/data-model' }]" />
		</template>

		<template #actions>
			<VDialog v-model="confirmDelete" @esc="confirmDelete = false" @apply="deleteAndQuit">
				<template #activator="{ on }">
					<PrivateViewHeaderBarActionButton
						v-if="isSystemCollection(collection) === false"
						v-tooltip.bottom="$t('delete_collection')"
						class="action-delete"
						secondary
						:disabled="!item"
						icon="delete"
						@click="on"
					/>
				</template>

				<VCard>
					<VCardTitle>{{ $t('delete_are_you_sure') }}</VCardTitle>

					<VCardActions>
						<VButton secondary @click="confirmDelete = false">
							{{ $t('cancel') }}
						</VButton>
						<VButton kind="danger" :loading="deleting" @click="deleteAndQuit">
							{{ $t('delete_label') }}
						</VButton>
					</VCardActions>
				</VCard>
			</VDialog>

			<PrivateViewHeaderBarActionButton
				v-tooltip.bottom="$t('save')"
				:loading="saving"
				:disabled="hasEdits === false"
				icon="check"
				@click="saveAndQuit"
			/>
		</template>

		<template #navigation>
			<SettingsNavigation />
		</template>

		<div class="collections-item">
			<div class="view-toggle">
				<VButton
					:class="{ active: viewMode === 'visual' }"
					secondary
					small
					@click="viewMode = 'visual'"
				>
					<v-icon name="visibility" small left />
					{{ $t('visual') }}
				</VButton>
				<VButton
					:class="{ active: viewMode === 'code' }"
					secondary
					small
					@click="viewMode = 'code'"
				>
					<v-icon name="code" small left />
					{{ $t('code') }}
				</VButton>
			</div>

			<v-divider />

			<div class="fields">
				<div class="fields-header">
					<h2 class="title type-label">
						{{ viewMode === 'visual' ? $t('fields_and_layout') : $t('schema_definition') }}
						<span v-if="viewMode === 'visual'" class="instant-save">{{ $t('saves_automatically') }}</span>
					</h2>

					<div v-if="viewMode === 'code'" class="code-options">
						<VCheckbox v-model="hideNulls" :label="$t('hide_nulls')" />
						<VButton v-tooltip.bottom="$t('copy_to_clipboard')" secondary icon small @click="copyJSON">
							<VIcon name="content_copy" />
						</VButton>
					</div>
				</div>

				<FieldsManagement v-if="viewMode === 'visual'" :collection="collection" />

				<div v-else-if="viewMode === 'code'" class="code-view">
					<div v-if="loadingSnapshot" class="loading">
						<v-progress-circular indeterminate />
					</div>
					<div v-else class="code-editor">
						<interface-input-code
							:value="displaySnapshotJSON"
							:disabled="true"
							:line-number="true"
							:line-wrapping="true"
							language="json"
						/>
					</div>
				</div>
			</div>

			<RouterView name="field" :collection="collection" :field="field" :type="type" />

			<VForm
				v-model="edits.meta"
				collection="directus_collections"
				:loading="loading"
				:initial-values="item?.meta"
				:primary-key="collection"
				:disabled="isSystemCollection(collection)"
			/>
		</div>

		<VDialog v-model="confirmLeave" @esc="confirmLeave = false" @apply="discardAndLeave">
			<VCard>
				<VCardTitle>{{ $t('unsaved_changes') }}</VCardTitle>
				<VCardText>{{ $t('unsaved_changes_copy') }}</VCardText>
				<VCardActions>
					<VButton secondary @click="discardAndLeave">
						{{ $t('discard_changes') }}
					</VButton>
					<VButton @click="confirmLeave = false">{{ $t('keep_editing') }}</VButton>
				</VCardActions>
			</VCard>
		</VDialog>
	</PrivateView>
</template>

<style lang="scss" scoped>
.title {
	margin-block-end: 12px;

	.instant-save {
		margin-inline-start: 4px;
		color: var(--theme--warning);
	}
}

.collections-item {
	padding: var(--content-padding);
	padding-block-end: var(--content-padding-bottom);
}

.view-toggle {
	display: flex;
	gap: 8px;
	background-color: var(--theme--background-subdued);
	border-radius: var(--theme--border-radius);
	padding: 4px;
	inline-size: fit-content;
	margin-block-end: 20px;

	.v-button {
		&.active {
			--v-button-background-color: var(--theme--background);
			--v-button-color: var(--theme--primary);
		}
	}
}

.fields {
	max-inline-size: 800px;
	margin-block: 24px 48px;
}

.fields-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-block-end: 12px;
}

.code-options {
	display: flex;
	align-items: center;
	gap: 12px;
}

.code-view {
	min-block-size: 400px;
	margin-block-start: 20px;

	.loading {
		display: flex;
		align-items: center;
		justify-content: center;
		min-block-size: 400px;
	}

	.code-editor {
		border: 1px solid var(--theme--border-color-subdued);
		border-radius: var(--theme--border-radius);
		overflow: hidden;
	}
}

.header-icon {
	--v-button-background-color: var(--theme--primary-background);
	--v-button-color: var(--theme--primary);
	--v-button-background-color-hover: var(--theme--primary-subdued);
	--v-button-color-hover: var(--theme--primary);
}

.action-delete {
	--v-button-background-color-hover: var(--theme--danger) !important;
	--v-button-color-hover: var(--white) !important;
}
</style>
