<script setup lang="ts">
import { useShortcut } from '@directus/composables';
import formatTitle from '@directus/format-title';
import { isSystemCollection } from '@directus/system-data';
import type { Field } from '@directus/types';
import { computed, ref, toRefs } from 'vue';
import { RouterView, useRouter } from 'vue-router';
import SettingsNavigation from '../../../components/navigation.vue';
import FieldsManagement from './components/fields-management.vue';
import VButton from '@/components/v-button.vue';
import VCardActions from '@/components/v-card-actions.vue';
import VCardText from '@/components/v-card-text.vue';
import VCardTitle from '@/components/v-card-title.vue';
import VCard from '@/components/v-card.vue';
import VDialog from '@/components/v-dialog.vue';
import VForm from '@/components/v-form/v-form.vue';
import { useEditsGuard } from '@/composables/use-edits-guard';
import { useItem } from '@/composables/use-item';
import { i18n } from '@/lang';
import { useCollectionsStore } from '@/stores/collections';
import { useFieldsStore } from '@/stores/fields';
import { useLicenseStore } from '@/stores/license';
import { useServerStore } from '@/stores/server';
import { PrivateViewHeaderBarActionButton } from '@/views/private';
import { PrivateView } from '@/views/private';

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
const licenseStore = useLicenseStore();
const serverStore = useServerStore();

const { edits, item, saving, loading, save, remove, deleting } = useItem(ref('directus_collections'), collection);

const collectionMetaFields = computed<Field[]>(() => {
	const fields = fieldsStore.getFieldsForCollection('directus_collections');
	const envSeconds = serverStore.info.autoSave?.revisionInterval ?? 300;

	const label =
		envSeconds < 60
			? i18n.global.t('field_options.directus_collections.interval_default_seconds', {
					seconds: envSeconds,
				})
			: i18n.global.t('field_options.directus_collections.interval_default', {
					minutes: Math.round(envSeconds / 60),
				});

	return fields.map((field) => {
		if (field.field !== 'autosave_revision_interval') return field;

		const choices = field.meta?.options?.['choices']?.map((choice: { text: string; value: unknown }) =>
			choice.value === null ? { ...choice, text: label } : choice,
		);

		return {
			...field,
			meta: field.meta && {
				...field.meta,
				options: { ...field.meta.options, choices },
			},
		};
	});
});

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
	await Promise.all([collectionsStore.hydrate(), fieldsStore.hydrate(), licenseStore.hydrate()]);
	edits.value = {};
	router.replace({ name: 'settings-collections' });
}

async function saveAndStay() {
	await save();
	await Promise.all([collectionsStore.hydrate(), fieldsStore.hydrate(), licenseStore.hydrate()]);
}

async function saveAndQuit() {
	await save();
	await Promise.all([collectionsStore.hydrate(), fieldsStore.hydrate(), licenseStore.hydrate()]);
	router.push({ name: 'settings-collections' });
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
		<template #actions>
			<VDialog v-model="confirmDelete" @esc="confirmDelete = false" @apply="deleteAndQuit">
				<template #activator="{ on }">
					<PrivateViewHeaderBarActionButton
						v-if="isSystemCollection(collection) === false"
						v-tooltip.bottom="$t('delete_collection')"
						kind="danger"
						variant="ghost"
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
		</template>

		<template #actions:primary>
			<PrivateViewHeaderBarActionButton
				:label="$t('save')"
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
				:fields="collectionMetaFields"
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
	margin-block-end: 0.6875rem;

	.instant-save {
		margin-inline-start: 0.25rem;
		color: var(--theme--warning);
	}
}

.collections-item {
	padding-inline: var(--content-padding);
	padding-block: var(--content-padding) var(--content-padding-bottom);
}

.fields {
	max-inline-size: 45rem;
	margin-block-end: 2.6875rem;
}
</style>
