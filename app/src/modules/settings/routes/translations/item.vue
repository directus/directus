<template>
	<content-not-found v-if="error" />

	<private-view v-else :title="primaryKey === '+' ? t('create_custom_translation') : t('edit_custom_translation')">
		<template #title-outer:prepend>
			<v-button
				v-if="collectionInfo?.meta && collectionInfo.meta.singleton === true"
				class="header-icon"
				rounded
				icon
				secondary
				disabled
			>
				<v-icon :name="collectionInfo.icon" />
			</v-button>

			<v-button
				v-else
				v-tooltip.bottom="t('back')"
				class="header-icon"
				rounded
				icon
				secondary
				exact
				@click="navigateBack"
			>
				<v-icon name="arrow_back" />
			</v-button>
		</template>

		<template #headline>
			<v-breadcrumb
				v-if="collectionInfo?.meta && collectionInfo.meta.singleton === true"
				:items="[{ name: t('content'), to: '/content' }]"
			/>
			<v-breadcrumb v-else :items="breadcrumb" />
		</template>

		<template #actions>
			<v-dialog v-if="!isNew" v-model="confirmDelete" @esc="confirmDelete = false">
				<template #activator="{ on }">
					<v-button
						v-if="collectionInfo!.meta && collectionInfo!.meta.singleton === false"
						v-tooltip.bottom="t('delete_label')"
						rounded
						icon
						class="action-delete"
						secondary
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

			<v-button v-tooltip.bottom="t('save')" rounded icon :loading="saving" :disabled="!isSavable" @click="saveAndQuit">
				<v-icon name="check" />

				<template #append-outer>
					<save-options
						:disabled-options="disabledOptions"
						@save-and-stay="saveAndStay"
						@save-and-add-new="saveAndAddNew"
						@save-as-copy="saveAsCopyAndNavigate"
						@discard-and-stay="discardAndStay"
					/>
				</template>
			</v-button>
		</template>

		<template #navigation>
			<SettingsNavigation current-collection="directus_translations" />
		</template>

		<v-form
			ref="form"
			v-model="edits"
			:autofocus="isNew"
			:loading="loading"
			:initial-values="item"
			collection="directus_translations"
			:primary-key="internalPrimaryKey"
			:validation-errors="validationErrors"
		/>

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

		<template #sidebar>
			<sidebar-detail icon="info" :title="t('information')" close>
				<div v-md="t('page_help_settings_translations_item')" class="page-description" />
			</sidebar-detail>
			<template v-if="isNew === false && loading === false && internalPrimaryKey">
				<revisions-drawer-detail
					v-if="accountabilityScope === 'all'"
					ref="revisionsDrawerDetailRef"
					collection="directus_translations"
					:primary-key="internalPrimaryKey"
					:scope="accountabilityScope"
					@revert="revert"
				/>
				<comments-sidebar-detail collection="directus_translations" :primary-key="internalPrimaryKey" />
				<flow-sidebar-detail
					location="item"
					collection="directus_translations"
					:primary-key="internalPrimaryKey"
					:has-edits="hasEdits"
					@refresh="refresh"
				/>
			</template>
		</template>
	</private-view>
</template>

<script setup lang="ts">
import { computed, ref, toRefs, unref } from 'vue';
import { useI18n } from 'vue-i18n';

import { useEditsGuard } from '@/composables/use-edits-guard';
import { useItem } from '@/composables/use-item';
import { useShortcut } from '@/composables/use-shortcut';
import { refreshCurrentLanguage } from '@/lang/refresh-current-language';
import CommentsSidebarDetail from '@/views/private/components/comments-sidebar-detail.vue';
import FlowSidebarDetail from '@/views/private/components/flow-sidebar-detail.vue';
import RevisionsDrawerDetail from '@/views/private/components/revisions-drawer-detail.vue';
import SaveOptions from '@/views/private/components/save-options.vue';
import { useCollection } from '@directus/composables';
import { useRouter } from 'vue-router';
import SettingsNavigation from '../../components/navigation.vue';
import ContentNotFound from '../not-found.vue';

interface Props {
	primaryKey?: string | null;
}

const props = withDefaults(defineProps<Props>(), {
	primaryKey: null,
});

const { t } = useI18n();

const router = useRouter();

const form = ref<HTMLElement>();

const { primaryKey } = toRefs(props);
const { breadcrumb } = useBreadcrumb();

const revisionsDrawerDetailRef = ref<InstanceType<typeof RevisionsDrawerDetail> | null>(null);

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

function navigateBack() {
	const backState = router.options.history.state.back;

	if (typeof backState !== 'string' || !backState.startsWith('/login')) {
		router.back();
		return;
	}

	router.push(`/settings/translations`);
}

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

		revisionsDrawerDetailRef.value?.refresh?.();

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

<style lang="scss" scoped>
.action-delete {
	--v-button-background-color-hover: var(--danger) !important;
	--v-button-color-hover: var(--white) !important;
}

.header-icon.secondary {
	--v-button-background-color: var(--background-normal);
	--v-button-color-disabled: var(--foreground-normal);
	--v-button-color-active: var(--foreground-normal);
}

.v-form {
	padding: calc(var(--content-padding) * 3) var(--content-padding) var(--content-padding);
	padding-bottom: var(--content-padding-bottom);

	@media (min-width: 600px) {
		padding: var(--content-padding);
		padding-bottom: var(--content-padding-bottom);
	}
}

.title-loader {
	width: 260px;
}
</style>
