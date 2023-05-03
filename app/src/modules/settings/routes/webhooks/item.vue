<template>
	<private-view :title="title">
		<template #headline>
			<v-breadcrumb :items="[{ name: t('settings_webhooks'), to: '/settings/webhooks' }]" />
		</template>

		<template #title-outer:prepend>
			<v-button class="header-icon" rounded icon exact :to="`/settings/webhooks/`">
				<v-icon name="arrow_back" />
			</v-button>
		</template>

		<template #actions>
			<v-dialog v-model="confirmDelete" @esc="confirmDelete = false">
				<template #activator="{ on }">
					<v-button rounded icon class="action-delete" :disabled="item === null" @click="on">
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

			<v-button rounded icon :loading="saving" :disabled="hasEdits === false" @click="saveAndQuit">
				<v-icon name="check" />

				<template #append-outer>
					<save-options
						v-if="hasEdits === true"
						@save-and-stay="saveAndStay"
						@save-and-add-new="saveAndAddNew"
						@save-as-copy="saveAsCopyAndNavigate"
						@discard-and-stay="discardAndStay"
					/>
				</template>
			</v-button>
		</template>

		<template #navigation>
			<settings-navigation />
		</template>

		<v-form
			v-model="edits"
			:loading="loading"
			:initial-values="item"
			collection="directus_webhooks"
			:batch-mode="isBatch"
			:primary-key="primaryKey"
			:validation-errors="validationErrors"
		/>

		<template #sidebar>
			<sidebar-detail icon="info" :title="t('information')" close>
				<div v-md="t('page_help_settings_webhooks_item')" class="page-description" />
			</sidebar-detail>
			<revisions-drawer-detail
				v-if="isNew === false"
				ref="revisionsDrawerDetailRef"
				collection="directus_webhooks"
				:primary-key="primaryKey"
			/>
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
import RevisionsDrawerDetail from '@/views/private/components/revisions-drawer-detail.vue';
import SaveOptions from '@/views/private/components/save-options.vue';
import { computed, ref, toRefs } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import SettingsNavigation from '../../components/navigation.vue';

const props = defineProps<{
	primaryKey: string;
}>();

const { t } = useI18n();

const router = useRouter();

const { primaryKey } = toRefs(props);

const revisionsDrawerDetailRef = ref<InstanceType<typeof RevisionsDrawerDetail> | null>(null);

const { isNew, edits, hasEdits, item, saving, loading, save, remove, deleting, saveAsCopy, isBatch, validationErrors } =
	useItem(ref('directus_webhooks'), primaryKey);

const confirmDelete = ref(false);

const title = computed(() => {
	if (loading.value) return t('loading');
	if (isNew.value) return t('creating_webhook');
	return item.value?.name;
});

useShortcut('meta+s', () => {
	if (hasEdits.value) saveAndStay();
});

useShortcut('meta+shift+s', () => {
	if (hasEdits.value) saveAndAddNew();
});

const { confirmLeave, leaveTo } = useEditsGuard(hasEdits);

async function saveAndQuit() {
	await save();
	router.push(`/settings/webhooks`);
}

async function saveAndStay() {
	await save();
	revisionsDrawerDetailRef.value?.refresh?.();
}

async function saveAndAddNew() {
	await save();
	router.push(`/settings/webhooks/+`);
}

async function saveAsCopyAndNavigate() {
	const newPrimaryKey = await saveAsCopy();
	if (newPrimaryKey) router.push(`/settings/webhooks/${newPrimaryKey}`);
}

async function deleteAndQuit() {
	await remove();
	edits.value = {};
	router.replace(`/settings/webhooks`);
}

function discardAndLeave() {
	if (!leaveTo.value) return;
	edits.value = {};
	confirmLeave.value = false;
	router.push(leaveTo.value);
}

function discardAndStay() {
	edits.value = {};
	confirmLeave.value = false;
}
</script>

<style lang="scss" scoped>
.action-delete {
	--v-button-background-color: var(--danger-10);
	--v-button-color: var(--danger);
	--v-button-background-color-hover: var(--danger-25);
	--v-button-color-hover: var(--danger);
}

.v-form {
	padding: var(--content-padding);
	padding-bottom: var(--content-padding-bottom);
}

.header-icon {
	--v-button-background-color: var(--primary-10);
	--v-button-color: var(--primary);
	--v-button-background-color-hover: var(--primary-25);
	--v-button-color-hover: var(--primary);
}
</style>
