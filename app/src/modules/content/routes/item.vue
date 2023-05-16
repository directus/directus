<template>
	<content-not-found
		v-if="error || !collectionInfo || (collectionInfo?.meta?.singleton === true && primaryKey !== null)"
	/>

	<private-view v-else :title="title">
		<template v-if="collectionInfo.meta && collectionInfo.meta.singleton === true" #title>
			<h1 class="type-title">
				{{ collectionInfo.name }}
			</h1>
		</template>

		<template v-else-if="isNew === false && collectionInfo.meta && collectionInfo.meta.display_template" #title>
			<v-skeleton-loader v-if="loading || templateDataLoading" class="title-loader" type="text" />

			<h1 v-else class="type-title">
				<render-template
					:collection="collectionInfo.collection"
					:item="templateData"
					:template="collectionInfo.meta.display_template"
				/>
			</h1>
		</template>

		<template #title-outer:prepend>
			<v-button
				v-if="collectionInfo.meta && collectionInfo.meta.singleton === true"
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
				v-if="collectionInfo.meta && collectionInfo.meta.singleton === true"
				:items="[{ name: t('content'), to: '/content' }]"
			/>
			<v-breadcrumb v-else :items="breadcrumb" />
		</template>

		<template #actions>
			<v-dialog v-if="!isNew" v-model="confirmDelete" :disabled="deleteAllowed === false" @esc="confirmDelete = false">
				<template #activator="{ on }">
					<v-button
						v-if="collectionInfo.meta && collectionInfo.meta.singleton === false"
						v-tooltip.bottom="deleteAllowed ? t('delete_label') : t('not_allowed')"
						rounded
						icon
						class="action-delete"
						secondary
						:disabled="item === null || deleteAllowed !== true"
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

			<v-dialog
				v-if="collectionInfo.meta && collectionInfo.meta.archive_field && !isNew"
				v-model="confirmArchive"
				:disabled="archiveAllowed === false"
				@esc="confirmArchive = false"
			>
				<template #activator="{ on }">
					<v-button
						v-if="collectionInfo.meta && collectionInfo.meta.singleton === false"
						v-tooltip.bottom="archiveTooltip"
						rounded
						icon
						secondary
						:disabled="item === null || archiveAllowed !== true"
						@click="on"
					>
						<v-icon :name="isArchived ? 'unarchive' : 'archive'" outline />
					</v-button>
				</template>

				<v-card>
					<v-card-title>{{ isArchived ? t('unarchive_confirm') : t('archive_confirm') }}</v-card-title>

					<v-card-actions>
						<v-button secondary @click="confirmArchive = false">
							{{ t('cancel') }}
						</v-button>
						<v-button kind="warning" :loading="archiving" @click="toggleArchive">
							{{ isArchived ? t('unarchive') : t('archive') }}
						</v-button>
					</v-card-actions>
				</v-card>
			</v-dialog>

			<v-button
				v-tooltip.bottom="saveAllowed ? t('save') : t('not_allowed')"
				rounded
				icon
				:loading="saving"
				:disabled="!isSavable"
				@click="saveAndQuit"
			>
				<v-icon name="check" />

				<template #append-outer>
					<save-options
						v-if="collectionInfo.meta && collectionInfo.meta.singleton !== true && isSavable === true"
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
			<content-navigation :current-collection="collection" />
		</template>

		<v-form
			ref="form"
			v-model="edits"
			:autofocus="isNew"
			:disabled="isNew ? false : updateAllowed === false"
			:loading="loading"
			:initial-values="item"
			:fields="fields"
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
				<div v-md="t('page_help_collections_item')" class="page-description" />
			</sidebar-detail>
			<revisions-drawer-detail
				v-if="
					isNew === false &&
					loading === false &&
					internalPrimaryKey &&
					revisionsAllowed &&
					accountabilityScope === 'all'
				"
				ref="revisionsDrawerDetailRef"
				:collection="collection"
				:primary-key="internalPrimaryKey"
				:scope="accountabilityScope"
				@revert="revert"
			/>
			<comments-sidebar-detail
				v-if="isNew === false && loading === false && internalPrimaryKey"
				:collection="collection"
				:primary-key="internalPrimaryKey"
			/>
			<shares-sidebar-detail
				v-if="isNew === false && loading === false && internalPrimaryKey"
				:collection="collection"
				:primary-key="internalPrimaryKey"
				:allowed="shareAllowed"
			/>
			<flow-sidebar-detail
				v-if="isNew === false && loading === false && internalPrimaryKey"
				location="item"
				:collection="collection"
				:primary-key="internalPrimaryKey"
				:has-edits="hasEdits"
				@refresh="refresh"
			/>
		</template>
	</private-view>
</template>

<script setup lang="ts">
import { computed, ref, unref, toRefs } from 'vue';
import { useI18n } from 'vue-i18n';

import { useEditsGuard } from '@/composables/use-edits-guard';
import { useItem } from '@/composables/use-item';
import { usePermissions } from '@/composables/use-permissions';
import { useShortcut } from '@/composables/use-shortcut';
import { useTemplateData } from '@/composables/use-template-data';
import { useTitle } from '@/composables/use-title';
import { renderStringTemplate } from '@/utils/render-string-template';
import CommentsSidebarDetail from '@/views/private/components/comments-sidebar-detail.vue';
import FlowSidebarDetail from '@/views/private/components/flow-sidebar-detail.vue';
import RevisionsDrawerDetail from '@/views/private/components/revisions-drawer-detail.vue';
import SaveOptions from '@/views/private/components/save-options.vue';
import SharesSidebarDetail from '@/views/private/components/shares-sidebar-detail.vue';
import { useCollection } from '@directus/composables';
import { useRouter } from 'vue-router';
import ContentNavigation from '../components/navigation.vue';
import ContentNotFound from './not-found.vue';

interface Props {
	collection: string;
	primaryKey?: string | null;
	singleton?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
	primaryKey: null,
	singleton: false,
});

const { t, te } = useI18n();

const router = useRouter();

const form = ref<HTMLElement>();

const { collection, primaryKey } = toRefs(props);
const { breadcrumb } = useBreadcrumb();

const revisionsDrawerDetailRef = ref<InstanceType<typeof RevisionsDrawerDetail> | null>(null);

const { info: collectionInfo, defaults, primaryKeyField, isSingleton, accountabilityScope } = useCollection(collection);

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
	archive,
	archiving,
	isArchived,
	saveAsCopy,
	refresh,
	validationErrors,
} = useItem(collection, primaryKey);

const { templateData, loading: templateDataLoading } = useTemplateData(collectionInfo, primaryKey);

const isSavable = computed(() => {
	if (saveAllowed.value === false) return false;
	if (hasEdits.value === true) return true;

	if (!primaryKeyField.value?.schema?.has_auto_increment && !primaryKeyField.value?.meta?.special?.includes('uuid')) {
		return !!edits.value?.[primaryKeyField.value.field];
	}

	if (isNew.value === true) {
		return Object.keys(defaults.value).length > 0 || hasEdits.value;
	}

	return hasEdits.value;
});

const { confirmLeave, leaveTo } = useEditsGuard(hasEdits);
const confirmDelete = ref(false);
const confirmArchive = ref(false);

const title = computed(() => {
	if (te(`collection_names_singular.${props.collection}`)) {
		return isNew.value
			? t('creating_unit', { unit: t(`collection_names_singular.${props.collection}`) })
			: t('editing_unit', { unit: t(`collection_names_singular.${props.collection}`) });
	}

	return isNew.value
		? t('creating_in', { collection: collectionInfo.value?.name })
		: t('editing_in', { collection: collectionInfo.value?.name });
});

const tabTitle = computed(() => {
	let tabTitle = (collectionInfo.value?.name || '') + ' | ';

	if (collectionInfo.value && collectionInfo.value.meta) {
		if (collectionInfo.value.meta.singleton === true) {
			return tabTitle + collectionInfo.value.name;
		} else if (isNew.value === false && collectionInfo.value.meta.display_template) {
			const { displayValue } = renderStringTemplate(collectionInfo.value.meta.display_template, templateData);

			if (displayValue.value !== undefined) return tabTitle + displayValue.value;
		}
	}

	return tabTitle + title.value;
});

useTitle(tabTitle);

const archiveTooltip = computed(() => {
	if (archiveAllowed.value === false) return t('not_allowed');
	if (isArchived.value === true) return t('unarchive');
	return t('archive');
});

useShortcut('meta+s', saveAndStay, form);
useShortcut('meta+shift+s', saveAndAddNew, form);

const {
	createAllowed,
	deleteAllowed,
	archiveAllowed,
	saveAllowed,
	updateAllowed,
	shareAllowed,
	fields,
	revisionsAllowed,
} = usePermissions(collection, item, isNew);

const internalPrimaryKey = computed(() => {
	if (unref(loading)) return '+';
	if (unref(isNew)) return '+';

	if (unref(isSingleton)) return unref(item)?.[unref(primaryKeyField)?.field] ?? '+';

	return props.primaryKey;
});

const disabledOptions = computed(() => {
	if (!createAllowed.value) return ['save-and-add-new', 'save-as-copy'];
	if (isNew.value) return ['save-as-copy'];
	return [];
});

function navigateBack() {
	const backState = router.options.history.state.back;

	if (typeof backState !== 'string' || !backState.startsWith('/login')) {
		router.back();
		return;
	}

	router.push(`/content/${props.collection}`);
}

function useBreadcrumb() {
	const breadcrumb = computed(() => [
		{
			name: collectionInfo.value?.name,
			to: `/content/${props.collection}`,
		},
	]);

	return { breadcrumb };
}

async function saveAndQuit() {
	if (isSavable.value === false) return;

	try {
		await save();
		if (props.singleton === false) router.push(`/content/${props.collection}`);
	} catch {
		// Save shows unexpected error dialog
	}
}

async function saveAndStay() {
	if (isSavable.value === false) return;

	try {
		const savedItem: Record<string, any> = await save();

		revisionsDrawerDetailRef.value?.refresh?.();

		if (props.primaryKey === '+') {
			const newPrimaryKey = savedItem[primaryKeyField.value!.field];
			router.replace(`/content/${props.collection}/${encodeURIComponent(newPrimaryKey)}`);
		}
	} catch {
		// Save shows unexpected error dialog
	}
}

async function saveAndAddNew() {
	if (isSavable.value === false) return;

	try {
		await save();

		if (isNew.value === true) {
			refresh();
		} else {
			router.push(`/content/${props.collection}/+`);
		}
	} catch {
		// Save shows unexpected error dialog
	}
}

async function saveAsCopyAndNavigate() {
	try {
		const newPrimaryKey = await saveAsCopy();
		if (newPrimaryKey) router.replace(`/content/${props.collection}/${encodeURIComponent(newPrimaryKey)}`);
	} catch {
		// Save shows unexpected error dialog
	}
}

async function deleteAndQuit() {
	try {
		await remove();
		edits.value = {};
		router.replace(`/content/${props.collection}`);
	} catch {
		// `remove` will show the unexpected error dialog
	}
}

async function toggleArchive() {
	try {
		await archive();

		if (isArchived.value === true) {
			router.push(`/content/${props.collection}`);
		} else {
			confirmArchive.value = false;
		}
	} catch {
		// `archive` will show the unexpected error dialog
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

function revert(values: Record<string, any>) {
	edits.value = {
		...edits.value,
		...values,
	};
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
