<script setup lang="ts">
import VBreadcrumb from '@/components/v-breadcrumb.vue';
import VButton from '@/components/v-button.vue';
import VCardActions from '@/components/v-card-actions.vue';
import VCardText from '@/components/v-card-text.vue';
import VCardTitle from '@/components/v-card-title.vue';
import VCard from '@/components/v-card.vue';
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
import { computed, ref, toRefs } from 'vue';
import { RouterView, useRouter } from 'vue-router';
import SettingsNavigation from '../../../components/navigation.vue';
import FieldsManagement from './components/fields-management.vue';

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
	<PrivateView :title="formatTitle(collection)" show-back back-to="/settings/data-model">
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
			<div class="fields">
				<h2 class="title type-label">
					{{ $t('fields_and_layout') }}
					<span class="instant-save">{{ $t('saves_automatically') }}</span>
				</h2>
				<FieldsManagement :collection="collection" />
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

.fields {
	max-inline-size: 800px;
	margin-block-end: 48px;
}

.action-delete {
	--v-button-background-color-hover: var(--theme--danger) !important;
	--v-button-color-hover: var(--white) !important;
}
</style>
