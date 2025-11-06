<script setup lang="ts">
import { useEditsGuard } from '@/composables/use-edits-guard';
import { useItem } from '@/composables/use-item';
import { useLocalStorage } from '@/composables/use-local-storage';
import { useItemPermissions } from '@/composables/use-permissions';
import { useShortcut } from '@/composables/use-shortcut';
import { useTemplateData } from '@/composables/use-template-data';
import { useVersions } from '@/composables/use-versions';
import { useFlows } from '@/composables/use-flows';
import { getCollectionRoute, getItemRoute } from '@/utils/get-route';
import { renderStringTemplate } from '@/utils/render-string-template';
import { translateShortcut } from '@/utils/translate-shortcut';
import CommentsSidebarDetail from '@/views/private/components/comments-sidebar-detail.vue';
import FlowSidebarDetail from '@/views/private/components/flow-sidebar-detail.vue';
import LivePreview from '@/views/private/components/live-preview.vue';
import RevisionsSidebarDetail from '@/views/private/components/revisions-sidebar-detail.vue';
import SaveOptions from '@/views/private/components/save-options.vue';
import SharesSidebarDetail from '@/views/private/components/shares-sidebar-detail.vue';
import FlowDialogs from '@/views/private/components/flow-dialogs.vue';
import { useCollection } from '@directus/composables';
import type { PrimaryKey } from '@directus/types';
import { useHead } from '@unhead/vue';
import { computed, onBeforeUnmount, ref, toRefs, unref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter, useRoute } from 'vue-router';
import ContentNavigation from '../components/navigation.vue';
import VersionMenu from '../components/version-menu.vue';
import ContentNotFound from './not-found.vue';
import { useCollab } from '@/composables/use-collab';

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
const { collectionRoute } = useCollectionRoute();

const form = ref<HTMLElement>();

const { collection, primaryKey } = toRefs(props);
const { breadcrumb } = useBreadcrumb();

const revisionsSidebarDetailRef = ref<InstanceType<typeof RevisionsSidebarDetail> | null>(null);

const { info: collectionInfo, defaults, primaryKeyField, isSingleton, accountabilityScope } = useCollection(collection);

const {
	readVersionsAllowed,
	currentVersion,
	versions,
	loading: versionsLoading,
	query,
	addVersion,
	updateVersion,
	deleteVersion,
	saveVersionLoading,
	saveVersion,
	validationErrors: versionValidationErrors,
} = useVersions(collection, isSingleton, primaryKey);

const {
	isNew,
	edits,
	hasEdits,
	item,
	permissions,
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
	validationErrors: itemValidationErrors,
} = useItem(collection, primaryKey, query);

const { onSave, users: collabUsers } = useCollab(collection, primaryKey, currentVersion, edits, refresh);

const validationErrors = computed(() => {
	if (currentVersion.value === null) return itemValidationErrors.value;
	return versionValidationErrors.value;
});

const {
	collectionPermissions: { createAllowed, revisionsAllowed },
	itemPermissions: { updateAllowed, deleteAllowed, saveAllowed, archiveAllowed, shareAllowed, fields },
} = permissions;

const { templateData } = useTemplateData(collectionInfo, primaryKey);

const { confirmLeave, leaveTo } = useEditsGuard(hasEdits, { compareQuery: ['version'] });
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

useHead({
	title: () => {
		const tabTitle = (collectionInfo.value?.name || '') + ' | ';

		if (collectionInfo.value && collectionInfo.value.meta) {
			if (collectionInfo.value.meta.singleton === true) {
				return tabTitle + collectionInfo.value.name;
			} else if (isNew.value === false && collectionInfo.value.meta.display_template) {
				const { displayValue } = renderStringTemplate(collectionInfo.value.meta.display_template, templateData);

				if (displayValue.value !== undefined) return tabTitle + displayValue.value;
			}
		}

		return tabTitle + title.value;
	},
});

const archiveTooltip = computed(() => {
	if (archiveAllowed.value === false) return t('not_allowed');
	if (isArchived.value === true) return t('unarchive');
	return t('archive');
});

useShortcut(
	'meta+s',
	() => {
		if (unref(currentVersion) === null) {
			saveAndStay();
		} else {
			saveVersionAction('stay');
		}
	},
	form,
);

useShortcut(
	'meta+shift+s',
	() => {
		if (unref(currentVersion) === null) {
			saveAndAddNew();
		} else {
			saveVersionAction('quit');
		}
	},
	form,
);

useShortcut(
	'meta+alt+s',
	() => {
		if (unref(currentVersion) !== null) {
			saveVersionAction('main');
		}
	},
	form,
);

const isSavable = computed(() => {
	if (saveAllowed.value === false && currentVersion.value === null) return false;
	if (hasEdits.value === true) return true;

	if (
		primaryKeyField.value &&
		!primaryKeyField.value?.schema?.has_auto_increment &&
		!primaryKeyField.value?.meta?.special?.includes('uuid')
	) {
		return !!edits.value?.[primaryKeyField.value.field];
	}

	if (isNew.value === true) {
		return Object.keys(defaults.value).length > 0 || hasEdits.value;
	}

	return hasEdits.value;
});

const { updateAllowed: updateVersionsAllowed } = useItemPermissions(
	'directus_versions',
	computed(() => currentVersion.value?.id ?? null),
	computed(() => !currentVersion.value),
);

const isFormDisabled = computed(() => {
	if (isNew.value) return false;
	if (updateAllowed.value) return false;
	if (currentVersion.value !== null && updateVersionsAllowed.value) return false;
	return true;
});

const actualPrimaryKey = computed(() => {
	if (unref(isSingleton)) {
		const singleton = unref(item);
		const pkField = unref(primaryKeyField)?.field;
		return (singleton && pkField ? (singleton[pkField] ?? null) : null) as PrimaryKey | null;
	}

	return props.primaryKey;
});

const internalPrimaryKey = computed(() => {
	if (unref(loading)) return '+';
	if (unref(isNew)) return '+';

	if (unref(isSingleton)) {
		const singleton = unref(item);
		const pkField = unref(primaryKeyField)?.field;
		return (singleton && pkField ? (singleton[pkField] ?? '+') : '+') as PrimaryKey;
	}

	return props.primaryKey;
});

const disabledOptions = computed(() => {
	if (!createAllowed.value) return ['save-and-add-new', 'save-as-copy'];
	if (isNew.value) return ['save-as-copy'];
	return [];
});

watch(currentVersion, () => {
	edits.value = {};
});

const previewTemplate = computed(() => collectionInfo.value?.meta?.preview_url ?? '');

const { templateData: previewData, fetchTemplateValues } = useTemplateData(collectionInfo, primaryKey, {
	template: previewTemplate,
	injectData: computed(() => ({ $version: currentVersion.value?.key ?? 'main' })),
});

const previewUrl = computed(() => {
	const { displayValue } = renderStringTemplate(previewTemplate.value, previewData.value);

	if (!displayValue.value) return null;

	return displayValue.value.trim() || null;
});

const { data: livePreviewMode } = useLocalStorage<'split' | 'popup'>('live-preview-mode', null);

const splitView = computed({
	get() {
		if (!collectionInfo.value?.meta?.preview_url) return false;
		if (unref(isNew)) return false;

		return livePreviewMode.value === 'split';
	},
	set(value) {
		livePreviewMode.value = value ? 'split' : null;
	},
});

let popupWindow: Window | null = null;

watch(
	[livePreviewMode, previewUrl],
	([mode, url]) => {
		if (mode !== 'popup' || !url) {
			if (popupWindow) popupWindow.close();
			return;
		}

		const targetUrl = new URL(window.location.href);
		targetUrl.pathname += targetUrl.pathname.endsWith('/') ? 'preview' : '/preview';

		popupWindow = window.open(
			targetUrl,
			'live-preview',
			'width=900,height=800,menubar=no,toolbar=no,location=no,status=no,scrollbars=yes,resizable=yes',
		);

		if (popupWindow) {
			const timer = setInterval(() => {
				if (!popupWindow?.closed) return;

				clearInterval(timer);
				popupWindow = null;

				if (livePreviewMode.value === 'popup') livePreviewMode.value = 'split';
			}, 1000);
		}
	},
	{ immediate: true },
);

const { flowDialogsContext, manualFlows, provideRunManualFlow } = useFlows({
	collection: collection.value,
	primaryKey: actualPrimaryKey.value,
	location: 'item',
	hasEdits,
	onRefreshCallback: refresh,
});

provideRunManualFlow();

function toggleSplitView() {
	if (livePreviewMode.value === null) {
		livePreviewMode.value = 'split';
	} else {
		livePreviewMode.value = null;
	}
}

async function refreshLivePreview() {
	try {
		await fetchTemplateValues();
		window.refreshLivePreview(previewUrl.value);
		if (popupWindow) popupWindow.refreshLivePreview(previewUrl.value);
	} catch {
		// noop
	}
}

watch(saving, async (newVal, oldVal) => {
	if (newVal === true || oldVal === false) return;

	await refreshLivePreview();
});

watch(saveVersionLoading, async (newVal, oldVal) => {
	if (newVal === true || oldVal === false) return;

	await refreshLivePreview();
});

onBeforeUnmount(() => {
	if (popupWindow) popupWindow.close();
});

function navigateBack() {
	const backState = router.options.history.state.back;

	if (typeof backState !== 'string' || !backState.startsWith('/login')) {
		router.back();
		return;
	}

	router.push(collectionRoute.value);
}

function useBreadcrumb() {
	const breadcrumb = computed(() => [
		{
			name: collectionInfo.value?.name,
			to: collectionRoute.value,
		},
	]);

	return { breadcrumb };
}

async function saveVersionAction(action: 'main' | 'stay' | 'quit') {
	if (isSavable.value === false) return;

	try {
		await saveVersion(edits, ref(item.value ?? {}));
		edits.value = {};

		if (action === 'main') {
			currentVersion.value = null;
			refresh();
		} else if (action === 'stay') {
			refresh();
			revisionsSidebarDetailRef.value?.refresh?.();
		} else if (action === 'quit') {
			if (!props.singleton) router.push(`/content/${props.collection}`);
		}
	} catch {
		// Save shows unexpected error dialog
	}
}

async function saveAndStay() {
	if (isSavable.value === false) return;

	try {
		const savedItem: Record<string, any> = await save();
		onSave();

		if (props.primaryKey === '+') {
			const newPrimaryKey = savedItem[primaryKeyField.value!.field];

			router.replace(getItemRoute(props.collection, newPrimaryKey));
		} else {
			revisionsSidebarDetailRef.value?.refresh?.();
			refresh();
		}
	} catch {
		// Save shows unexpected error dialog
	}
}

async function saveAndAddNew() {
	if (isSavable.value === false) return;
	if (unref(currentVersion) !== null) return;

	try {
		await save();
		onSave();

		if (isNew.value === true) {
			refresh();
		} else {
			router.push(getItemRoute(props.collection, '+'));
		}
	} catch {
		// Save shows unexpected error dialog
	}
}

async function saveAsCopyAndNavigate() {
	try {
		const newPrimaryKey = await saveAsCopy();
		onSave();

		if (newPrimaryKey) router.replace(getItemRoute(props.collection, newPrimaryKey));
	} catch {
		// Save shows unexpected error dialog
	}
}

async function saveAndQuit() {
	if (isSavable.value === false) return;

	try {
		await save();
		onSave();
		if (props.singleton === false) router.push(collectionRoute.value);
	} catch {
		// Save shows unexpected error dialog
	}
}

async function deleteAndQuit() {
	if (deleting.value) return;

	try {
		await remove();
		edits.value = {};
		router.replace(collectionRoute.value);
	} catch {
		// `remove` will show the unexpected error dialog
	} finally {
		confirmDelete.value = false;
	}
}

async function toggleArchive() {
	if (archiving.value) return;

	try {
		await archive();

		if (isArchived.value === true) {
			router.push(collectionRoute.value);
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

const shouldShowVersioning = computed(
	() =>
		collectionInfo.value?.meta?.versioning &&
		!isNew.value &&
		internalPrimaryKey.value !== '+' &&
		readVersionsAllowed.value &&
		!versionsLoading.value,
);

function useCollectionRoute() {
	const route = useRoute();

	const collectionRoute = computed(() => {
		const collectionPath = getCollectionRoute(props.collection);
		if (route.query.bookmark) return `${collectionPath}?bookmark=${route.query.bookmark}`;
		return collectionPath;
	});

	return { collectionRoute };
}
</script>

<template>
	<content-not-found
		v-if="error || !collectionInfo || (collectionInfo?.meta?.singleton === true && primaryKey !== null)"
	/>

	<private-view
		v-else
		v-model:split-view="splitView"
		:class="{ 'has-content-versioning': shouldShowVersioning }"
		:split-view-min-width="310"
		:title="title"
	>
		<template v-if="collectionInfo.meta && collectionInfo.meta.singleton === true" #title>
			<h1 class="type-title">
				{{ collectionInfo.name }}
			</h1>
		</template>

		<template v-else-if="isNew === false && collectionInfo.meta && collectionInfo.meta.display_template" #title>
			<v-skeleton-loader v-if="loading" class="title-loader" type="text" />

			<h1 v-else class="type-title">
				<render-template
					:collection="collectionInfo.collection"
					:item="templateData"
					:template="collectionInfo.meta!.display_template"
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
			<div class="headline-wrapper" :class="{ 'has-version-menu': shouldShowVersioning }">
				<v-breadcrumb
					v-if="collectionInfo.meta && collectionInfo.meta.singleton === true"
					:items="[{ name: t('content'), to: '/content' }]"
					class="headline-breadcrumb"
				/>
				<v-breadcrumb v-else :items="breadcrumb" class="headline-breadcrumb" />

				<version-menu
					v-if="shouldShowVersioning"
					:collection="collection"
					:primary-key="internalPrimaryKey!"
					:update-allowed="updateAllowed"
					:has-edits="hasEdits"
					:current-version="currentVersion"
					:versions="versions"
					@add="addVersion"
					@update="updateVersion"
					@delete="deleteVersion"
					@switch="currentVersion = $event"
				/>
			</div>
		</template>

		<template #title-outer:append>
			{{ collabUsers }}
		</template>

		<template #actions>
			<v-button
				v-if="previewUrl"
				v-tooltip.bottom="t(livePreviewMode === null ? 'live_preview.enable' : 'live_preview.disable')"
				rounded
				icon
				class="action-preview"
				:secondary="livePreviewMode === null"
				@click="toggleSplitView"
			>
				<v-icon name="visibility" outline />
			</v-button>

			<v-dialog
				v-if="!isNew && currentVersion === null"
				v-model="confirmDelete"
				:disabled="deleteAllowed === false"
				@esc="confirmDelete = false"
				@apply="deleteAndQuit"
			>
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
				v-if="collectionInfo.meta && collectionInfo.meta.archive_field && !isNew && currentVersion === null"
				v-model="confirmArchive"
				:disabled="archiveAllowed === false"
				@esc="confirmArchive = false"
				@apply="toggleArchive"
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
				v-if="currentVersion === null"
				rounded
				icon
				:tooltip="saveAllowed ? t('save') : t('not_allowed')"
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
			<v-button
				v-else
				rounded
				icon
				:tooltip="t('save_version')"
				:loading="saveVersionLoading"
				:disabled="!isSavable"
				@click="saveVersionAction('stay')"
			>
				<v-icon name="beenhere" />

				<template #append-outer>
					<v-menu v-if="collectionInfo.meta && collectionInfo.meta.singleton !== true && isSavable === true" show-arrow>
						<template #activator="{ toggle }">
							<v-icon class="version-more-options" name="more_vert" clickable @click="toggle" />
						</template>

						<v-list>
							<v-list-item clickable @click="saveVersionAction('main')">
								<v-list-item-icon><v-icon name="check" /></v-list-item-icon>
								<v-list-item-content>{{ t('save_and_return_to_main') }}</v-list-item-content>
								<v-list-item-hint>{{ translateShortcut(['meta', 'alt', 's']) }}</v-list-item-hint>
							</v-list-item>
							<v-list-item clickable @click="saveVersionAction('quit')">
								<v-list-item-icon><v-icon name="done_all" /></v-list-item-icon>
								<v-list-item-content>{{ t('save_and_quit') }}</v-list-item-content>
								<v-list-item-hint>{{ translateShortcut(['meta', 'shift', 's']) }}</v-list-item-hint>
							</v-list-item>
							<v-list-item clickable @click="discardAndStay">
								<v-list-item-icon><v-icon name="undo" /></v-list-item-icon>
								<v-list-item-content>{{ t('discard_all_changes') }}</v-list-item-content>
							</v-list-item>
						</v-list>
					</v-menu>
				</template>
			</v-button>

			<flow-dialogs v-bind="flowDialogsContext" />
		</template>

		<template #navigation>
			<content-navigation :current-collection="collection" />
		</template>

		<v-form
			ref="form"
			v-model="edits"
			:autofocus="isNew"
			:disabled="isFormDisabled"
			:loading="loading"
			:initial-values="item"
			:fields="fields"
			:primary-key="internalPrimaryKey"
			:validation-errors="validationErrors"
			:version="currentVersion"
		/>

		<v-dialog v-model="confirmLeave" @esc="confirmLeave = false" @apply="discardAndLeave">
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

		<template #splitView>
			<live-preview v-if="previewUrl" :url="previewUrl" @new-window="livePreviewMode = 'popup'" />
		</template>

		<template #sidebar>
			<sidebar-detail icon="info" :title="t('information')" close>
				<div v-md="t('page_help_collections_item')" class="page-description" />
			</sidebar-detail>
			<template v-if="isNew === false && actualPrimaryKey">
				<revisions-sidebar-detail
					v-if="revisionsAllowed && accountabilityScope === 'all'"
					ref="revisionsSidebarDetailRef"
					:collection="collection"
					:primary-key="actualPrimaryKey"
					:version="currentVersion"
					:scope="accountabilityScope"
					@revert="revert"
				/>
				<comments-sidebar-detail
					v-if="currentVersion === null"
					:collection="collection"
					:primary-key="actualPrimaryKey"
				/>
				<shares-sidebar-detail
					v-if="currentVersion === null"
					:collection="collection"
					:primary-key="actualPrimaryKey"
					:allowed="shareAllowed"
				/>
				<flow-sidebar-detail v-if="currentVersion === null" :manual-flows />
			</template>
		</template>
	</private-view>
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

	@media (min-width: 600px) {
		padding: var(--content-padding);
		padding-block-end: var(--content-padding-bottom);
	}
}

.title-loader {
	inline-size: 260px;
}

.version-more-options.v-icon {
	--focus-ring-offset: var(--focus-ring-offset-invert);

	color: var(--theme--foreground-subdued);

	&:hover {
		color: var(--theme--foreground);
	}
}

.has-content-versioning {
	:deep(.header-bar .title-container) {
		flex-direction: column;
		justify-content: center;
		gap: 0;
		align-items: start;

		.headline {
			opacity: 1;
			inset-block-start: 3px;
		}

		.title {
			inset-block-start: 4px;
		}

		@media (min-width: 600px) {
			opacity: 1;
		}
	}

	.headline-wrapper {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	:deep(.header-bar.collapsed.shadow .title-container .headline) {
		opacity: 1;
		pointer-events: auto;
	}
	:deep(.header-bar.small.shadow .title-container .headline) {
		opacity: 1;
	}
}

.headline-wrapper.has-version-menu .headline-breadcrumb {
	@media (max-width: 600px) {
		display: none;
	}
}
</style>
