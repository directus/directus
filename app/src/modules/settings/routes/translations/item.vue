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
import { refreshCurrentLanguage } from '@/lang/refresh-current-language';
import CommentsSidebarDetail from '@/views/private/components/comments-sidebar-detail.vue';
import RevisionsSidebarDetail from '@/views/private/components/revisions-sidebar-detail.vue';
import SaveOptions from '@/views/private/components/save-options.vue';
import { PrivateViewHeaderBarActionButton } from '@/views/private';
import { PrivateView } from '@/views/private';
import { useCollection } from '@directus/composables';
import { computed, ref, toRefs, unref } from 'vue';
import { useRouter } from 'vue-router';
import SettingsNavigation from '../../components/navigation.vue';
import ContentNotFound from '../not-found.vue';

interface Props {
	primaryKey?: string | null;
}

const props = withDefaults(defineProps<Props>(), {
	primaryKey: null,
});

const router = useRouter();

const form = ref<HTMLElement>();

const { primaryKey } = toRefs(props);
const { breadcrumb } = useBreadcrumb();

const revisionsSidebarDetailRef = ref<InstanceType<typeof RevisionsSidebarDetail> | null>(null);

const {
	info: collectionInfo,
	defaults,
	primaryKeyField,
	isSingleton,
	accountabilityScope,
} = useCollection('directus_translations');

const {
	isNew,
	edits,
	hasEdits,
	item,
	saving,
	loading,
	error,
	save,
	remove,
	deleting,
	saveAsCopy,
	refresh,
	validationErrors,
} = useItem(ref('directus_translations'), primaryKey);

const isSavable = computed(() => {
	if (hasEdits.value === true) return true;

	if (!primaryKeyField.value?.schema?.has_auto_increment && !primaryKeyField.value?.meta?.special?.includes('uuid')) {
		return !!edits.value?.[primaryKeyField.value!.field];
	}

	if (isNew.value === true) {
		return Object.keys(defaults.value).length > 0 || hasEdits.value;
	}

	return hasEdits.value;
});

const { confirmLeave, leaveTo } = useEditsGuard(hasEdits);
const confirmDelete = ref(false);

useShortcut('meta+s', saveAndStay, form);
useShortcut('meta+shift+s', saveAndAddNew, form);

const internalPrimaryKey = computed(() => {
	if (unref(loading)) return '+';
	if (unref(isNew)) return '+';

	if (unref(isSingleton)) {
		const pkField = unref(primaryKeyField)?.field;

		if (pkField) {
			return unref(item)?.[pkField] ?? '+';
		} else {
			return '+';
		}
	}

	return props.primaryKey;
});

const disabledOptions = computed(() => {
	if (isNew.value) return ['save-as-copy'];
	return [];
});

function useBreadcrumb() {
	const breadcrumb = computed(() => [
		{
			name: collectionInfo.value?.name,
			to: `/settings/translations`,
		},
	]);

	return { breadcrumb };
}

async function saveAndQuit() {
	if (isSavable.value === false) return;

	try {
		await save();
		await refreshCurrentLanguage();
		router.push(`/settings/translations`);
	} catch {
		// Save shows unexpected error dialog
	}
}

async function saveAndStay() {
	if (isSavable.value === false) return;

	try {
		const savedItem: Record<string, any> = await save();
		await refreshCurrentLanguage();

		revisionsSidebarDetailRef.value?.refresh?.();

		if (props.primaryKey === '+') {
			const newPrimaryKey = savedItem[primaryKeyField.value!.field];
			router.replace(`/settings/translations/${encodeURIComponent(newPrimaryKey)}`);
		}
	} catch {
		// Save shows unexpected error dialog
	}
}

async function saveAndAddNew() {
	if (isSavable.value === false) return;

	try {
		await save();
		await refreshCurrentLanguage();

		if (isNew.value === true) {
			refresh();
		} else {
			router.push(`/settings/translations/+`);
		}
	} catch {
		// Save shows unexpected error dialog
	}
}

async function saveAsCopyAndNavigate() {
	try {
		const newPrimaryKey = await saveAsCopy();
		if (newPrimaryKey) router.replace(`/settings/translations/${encodeURIComponent(newPrimaryKey)}`);
	} catch {
		// Save shows unexpected error dialog
	}
}

async function deleteAndQuit() {
	if (deleting.value) return;

	try {
		await remove();
		await refreshCurrentLanguage();

		edits.value = {};
		router.replace(`/settings/translations`);
	} catch {
		// `remove` will show the unexpected error dialog
	}
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

async function revert(values: Record<string, any>) {
	edits.value = {
		...edits.value,
		...values,
	};

	await refreshCurrentLanguage();
}
</script>

<template>
	<ContentNotFound v-if="error" />

	<PrivateView
		v-else
		:title="primaryKey === '+' ? $t('create_custom_translation') : $t('edit_custom_translation')"
		show-back
		back-to="/settings/translations"
	>
		<template #headline>
			<VBreadcrumb
				v-if="collectionInfo?.meta && collectionInfo.meta.singleton === true"
				:items="[{ name: $t('content'), to: '/content' }]"
			/>
			<VBreadcrumb v-else :items="breadcrumb" />
		</template>

		<template #actions>
			<VDialog v-if="!isNew" v-model="confirmDelete" @esc="confirmDelete = false" @apply="deleteAndQuit">
				<template #activator="{ on }">
					<PrivateViewHeaderBarActionButton
						v-if="collectionInfo!.meta && collectionInfo!.meta.singleton === false"
						v-tooltip.bottom="$t('delete_label')"
						class="action-delete"
						secondary
						:disabled="item === null"
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
				:disabled="!isSavable"
				icon="check"
				@click="saveAndQuit"
			>
				<template #append-outer>
					<SaveOptions
						v-if="hasEdits"
						:disabled-options="disabledOptions"
						@save-and-stay="saveAndStay"
						@save-and-add-new="saveAndAddNew"
						@save-as-copy="saveAsCopyAndNavigate"
						@discard-and-stay="discardAndStay"
					/>
				</template>
			</PrivateViewHeaderBarActionButton>
		</template>

		<template #navigation>
			<SettingsNavigation current-collection="directus_translations" />
		</template>

		<VForm
			ref="form"
			v-model="edits"
			:autofocus="isNew"
			:loading="loading"
			:initial-values="item"
			collection="directus_translations"
			:primary-key="internalPrimaryKey"
			:validation-errors="validationErrors"
		/>

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

		<template #sidebar>
			<template v-if="isNew === false && loading === false && internalPrimaryKey">
				<RevisionsSidebarDetail
					v-if="accountabilityScope === 'all'"
					ref="revisionsSidebarDetailRef"
					collection="directus_translations"
					:primary-key="internalPrimaryKey"
					:scope="accountabilityScope"
					@revert="revert"
				/>
				<CommentsSidebarDetail collection="directus_translations" :primary-key="internalPrimaryKey" />
			</template>
		</template>
	</PrivateView>
</template>

<style lang="scss" scoped>
.action-delete {
	--v-button-background-color-hover: var(--theme--danger) !important;
	--v-button-color-hover: var(--white) !important;
}

.header-icon.secondary {
	--v-button-background-color: var(--theme--background-normal);
	--v-button-color-disabled: var(--theme--foreground);
	--v-button-color-active: var(--theme--foreground);
}

.v-form {
	padding: calc(var(--content-padding) * 3) var(--content-padding) var(--content-padding);
	padding-block-end: var(--content-padding-bottom);

	@media (width > 640px) {
		padding: var(--content-padding);
		padding-block-end: var(--content-padding-bottom);
	}
}

.title-loader {
	inline-size: 260px;
}
</style>
