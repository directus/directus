<script setup lang="ts">
import { useCollection } from '@directus/composables';
import type { PrimaryKey } from '@directus/types';
import { SplitPanel } from '@directus/vue-split-panel';
import { useHead } from '@unhead/vue';
import { useBreakpoints, useLocalStorage, useScroll } from '@vueuse/core';
import { type ComponentPublicInstance, computed, onBeforeUnmount, provide, ref, toRefs, unref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import ContentNavigation from '../components/navigation.vue';
import VersionMenu from '../components/version-menu.vue';
import ContentNotFound from './not-found.vue';
import { useAiStore } from '@/ai/stores/use-ai';
import VBreadcrumb from '@/components/v-breadcrumb.vue';
import VButton from '@/components/v-button.vue';
import VCardActions from '@/components/v-card-actions.vue';
import VCardText from '@/components/v-card-text.vue';
import VCardTitle from '@/components/v-card-title.vue';
import VCard from '@/components/v-card.vue';
import VDialog from '@/components/v-dialog.vue';
import VForm from '@/components/v-form/v-form.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VListItemContent from '@/components/v-list-item-content.vue';
import VListItemHint from '@/components/v-list-item-hint.vue';
import VListItemIcon from '@/components/v-list-item-icon.vue';
import VListItem from '@/components/v-list-item.vue';
import VList from '@/components/v-list.vue';
import VMenu from '@/components/v-menu.vue';
import VSkeletonLoader from '@/components/v-skeleton-loader.vue';
import { useEditsGuard } from '@/composables/use-edits-guard';
import { useFlows } from '@/composables/use-flows';
import { useItem } from '@/composables/use-item';
import { useItemPermissions } from '@/composables/use-permissions';
import { useShortcut } from '@/composables/use-shortcut';
import { useTemplateData } from '@/composables/use-template-data';
import { useVersions } from '@/composables/use-versions';
import { useVisualEditing } from '@/composables/use-visual-editing';
import { BREAKPOINTS } from '@/constants';
import { useUserStore } from '@/stores/user';
import { getCollectionRoute, getItemRoute } from '@/utils/get-route';
import { renderStringTemplate } from '@/utils/render-string-template';
import { translateShortcut } from '@/utils/translate-shortcut';
import { PrivateView } from '@/views/private';
import CommentsSidebarDetail from '@/views/private/components/comments-sidebar-detail.vue';
import FlowDialogs from '@/views/private/components/flow-dialogs.vue';
import FlowSidebarDetail from '@/views/private/components/flow-sidebar-detail.vue';
import LivePreview from '@/views/private/components/live-preview.vue';
import RenderTemplate from '@/views/private/components/render-template.vue';
import RevisionsSidebarDetail from '@/views/private/components/revisions-sidebar-detail.vue';
import SaveOptions from '@/views/private/components/save-options.vue';
import SharesSidebarDetail from '@/views/private/components/shares-sidebar-detail.vue';
import PrivateViewResizeHandle from '@/views/private/private-view/components/private-view-resize-handle.vue';

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

const userStore = useUserStore();

const form = ref<ComponentPublicInstance>();

const scrollParent = computed(() => form.value?.$el?.parentElement);
const { y: formScrollY } = useScroll(scrollParent);
const showHeaderShadow = computed(() => formScrollY.value > 0);

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

const aiStore = useAiStore();

aiStore.onSystemToolResult((tool, input) => {
	if (tool === 'items' && input.collection === collection.value) {
		refresh();
	}
});

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

const livePreviewFullWidth = useLocalStorage<boolean>('live-preview-full-width', false);
const livePreviewMode = useLocalStorage<'split' | 'popup'>('live-preview-mode', null);
const livePreviewSizeDefault = 50;
const livePreviewSizeStorage = useLocalStorage<number>('live-preview-size', livePreviewSizeDefault);

const breakpoints = useBreakpoints(BREAKPOINTS);
const isMobile = breakpoints.smallerOrEqual('sm');

const livePreviewActive = computed(
	() => !!collectionInfo.value?.meta?.preview_url && !unref(isNew) && livePreviewMode.value === 'split',
);

const livePreviewCollapsed = computed({
	get() {
		return !livePreviewActive.value;
	},
	set(value: boolean) {
		livePreviewMode.value = value ? null : 'split';
	},
});

const livePreviewSize = computed({
	get() {
		if (isMobile.value || livePreviewFullWidth.value) {
			return livePreviewActive.value ? 100 : 0;
		}

		return livePreviewSizeStorage.value || livePreviewSizeDefault;
	},
	set(value: number) {
		if (isMobile.value) return;

		livePreviewSizeStorage.value = value;
	},
});

provide('live-preview-active', livePreviewActive);

const { visualEditingEnabled, visualEditorUrls } = useVisualEditing({ previewUrl, isNew });

watch(previewUrl, (url) => {
	if (!url) livePreviewFullWidth.value = false;
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
	collection,
	primaryKey: actualPrimaryKey,
	location: 'item',
	hasEdits,
	onRefreshCallback: refresh,
});

provideRunManualFlow();

async function refreshLivePreview() {
	try {
		await fetchTemplateValues();
		window.refreshLivePreview(previewUrl.value);
		if (popupWindow) popupWindow.refreshLivePreview(previewUrl.value);
	} catch {
		// noop
	}
}

function onVisualEditorSaved() {
	refresh();
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

		if (newPrimaryKey) router.replace(getItemRoute(props.collection, newPrimaryKey));
	} catch {
		// Save shows unexpected error dialog
	}
}

async function saveAndQuit() {
	if (isSavable.value === false) return;

	try {
		await save();
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
	<ContentNotFound
		v-if="error || !collectionInfo || (collectionInfo?.meta?.singleton === true && primaryKey !== null)"
	/>

	<PrivateView
		v-else
		:class="{ 'has-content-versioning': shouldShowVersioning }"
		:title
		:show-back="!collectionInfo.meta?.singleton"
		:back-to="collectionRoute"
		:show-header-shadow="showHeaderShadow"
		:icon="collectionInfo.meta?.singleton ? collectionInfo.icon : undefined"
	>
		<template v-if="collectionInfo.meta && collectionInfo.meta.singleton === true" #title>
			<h1 class="type-title">
				{{ collectionInfo.name }}
			</h1>
		</template>

		<template v-else-if="isNew === false && collectionInfo.meta && collectionInfo.meta.display_template" #title>
			<VSkeletonLoader v-if="loading" class="title-loader" type="text" />

			<h1 v-else class="type-title">
				<RenderTemplate
					:collection="collectionInfo.collection"
					:item="templateData"
					:template="collectionInfo.meta!.display_template"
				/>
			</h1>
		</template>

		<template #headline>
			<div class="headline-wrapper" :class="{ 'has-version-menu': shouldShowVersioning }">
				<VBreadcrumb
					v-if="collectionInfo.meta && collectionInfo.meta.singleton === true"
					:items="[{ name: $t('content'), to: '/content' }]"
					class="headline-breadcrumb"
				/>
				<VBreadcrumb v-else :items="breadcrumb" class="headline-breadcrumb" />

				<VersionMenu
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

		<template #title-outer:append></template>

		<template #actions>
			<VButton
				v-if="previewUrl"
				v-tooltip.bottom="$t(livePreviewMode === null ? 'live_preview.enable' : 'live_preview.disable')"
				rounded
				icon
				class="action-preview"
				:secondary="livePreviewMode === null"
				small
				@click="livePreviewCollapsed = !livePreviewCollapsed"
			>
				<VIcon name="visibility" outline small />
			</VButton>

			<VDialog
				v-if="!isNew && currentVersion === null"
				v-model="confirmDelete"
				:disabled="deleteAllowed === false"
				@esc="confirmDelete = false"
				@apply="deleteAndQuit"
			>
				<template #activator="{ on }">
					<VButton
						v-if="collectionInfo.meta && collectionInfo.meta.singleton === false"
						v-tooltip.bottom="deleteAllowed ? $t('delete_label') : $t('not_allowed')"
						rounded
						icon
						class="action-delete"
						secondary
						:disabled="item === null || deleteAllowed !== true"
						small
						@click="on"
					>
						<VIcon name="delete" outline small />
					</VButton>
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

			<VDialog
				v-if="collectionInfo.meta && collectionInfo.meta.archive_field && !isNew && currentVersion === null"
				v-model="confirmArchive"
				:disabled="archiveAllowed === false"
				@esc="confirmArchive = false"
				@apply="toggleArchive"
			>
				<template #activator="{ on }">
					<VButton
						v-if="collectionInfo.meta && collectionInfo.meta.singleton === false"
						v-tooltip.bottom="archiveTooltip"
						rounded
						icon
						secondary
						:disabled="item === null || archiveAllowed !== true"
						small
						@click="on"
					>
						<VIcon :name="isArchived ? 'unarchive' : 'archive'" outline small />
					</VButton>
				</template>

				<VCard>
					<VCardTitle>{{ isArchived ? $t('unarchive_confirm') : $t('archive_confirm') }}</VCardTitle>

					<VCardActions>
						<VButton secondary @click="confirmArchive = false">
							{{ $t('cancel') }}
						</VButton>
						<VButton kind="warning" :loading="archiving" @click="toggleArchive">
							{{ isArchived ? $t('unarchive') : $t('archive') }}
						</VButton>
					</VCardActions>
				</VCard>
			</VDialog>

			<VButton
				v-if="currentVersion === null"
				rounded
				icon
				:tooltip="saveAllowed ? $t('save') : $t('not_allowed')"
				:loading="saving"
				:disabled="!isSavable"
				small
				@click="saveAndQuit"
			>
				<VIcon name="check" small />

				<template #append-outer>
					<SaveOptions
						v-if="collectionInfo.meta && collectionInfo.meta.singleton !== true && isSavable === true"
						:disabled-options="disabledOptions"
						@save-and-stay="saveAndStay"
						@save-and-add-new="saveAndAddNew"
						@save-as-copy="saveAsCopyAndNavigate"
						@discard-and-stay="discardAndStay"
					/>
				</template>
			</VButton>
			<VButton
				v-else
				rounded
				icon
				:tooltip="$t('save_version')"
				:loading="saveVersionLoading"
				:disabled="!isSavable"
				small
				@click="saveVersionAction('stay')"
			>
				<VIcon name="beenhere" small />

				<template #append-outer>
					<VMenu v-if="collectionInfo.meta && collectionInfo.meta.singleton !== true && isSavable === true" show-arrow>
						<template #activator="{ toggle }">
							<VIcon class="version-more-options" name="more_vert" clickable @click="toggle" />
						</template>

						<VList>
							<VListItem clickable @click="saveVersionAction('main')">
								<VListItemIcon><VIcon name="check" /></VListItemIcon>
								<VListItemContent>{{ $t('save_and_return_to_main') }}</VListItemContent>
								<VListItemHint>{{ translateShortcut(['meta', 'alt', 's']) }}</VListItemHint>
							</VListItem>
							<VListItem clickable @click="saveVersionAction('quit')">
								<VListItemIcon><VIcon name="done_all" /></VListItemIcon>
								<VListItemContent>{{ $t('save_and_quit') }}</VListItemContent>
								<VListItemHint>{{ translateShortcut(['meta', 'shift', 's']) }}</VListItemHint>
							</VListItem>
							<VListItem clickable @click="discardAndStay">
								<VListItemIcon><VIcon name="undo" /></VListItemIcon>
								<VListItemContent>{{ $t('discard_all_changes') }}</VListItemContent>
							</VListItem>
						</VList>
					</VMenu>
				</template>
			</VButton>

			<FlowDialogs v-bind="flowDialogsContext" />
		</template>

		<template #navigation>
			<ContentNavigation :current-collection="collection" />
		</template>

		<SplitPanel
			v-model:size="livePreviewSize"
			v-model:collapsed="livePreviewCollapsed"
			primary="end"
			size-unit="%"
			collapsible
			:collapsed-size="0"
			:collapse-threshold="15"
			:min-size="isMobile ? 0 : 20"
			:max-size="isMobile || livePreviewFullWidth ? 100 : 80"
			:snap-points="[livePreviewSizeDefault]"
			:transition-duration="150"
			class="content-split"
			:disabled="isMobile"
		>
			<template #start>
				<VForm
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
					:direction="userStore.textDirection"
				/>
			</template>

			<template #divider>
				<PrivateViewResizeHandle />
			</template>

			<template #end>
				<LivePreview
					v-if="livePreviewActive && previewUrl"
					:url="previewUrl"
					:can-enable-visual-editing="visualEditingEnabled"
					:visual-editor-urls="visualEditorUrls"
					@new-window="livePreviewMode = 'popup'"
					@saved="onVisualEditorSaved"
				>
					<template #prepend-header>
						<VButton
							v-tooltip.bottom.end="$t('full_width')"
							x-small
							rounded
							icon
							:secondary="!livePreviewFullWidth"
							@click="livePreviewFullWidth = !livePreviewFullWidth"
						>
							<VIcon small name="width_full" outline />
						</VButton>
					</template>
				</LivePreview>
			</template>
		</SplitPanel>

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
			<template v-if="isNew === false && actualPrimaryKey">
				<RevisionsSidebarDetail
					v-if="revisionsAllowed && accountabilityScope === 'all'"
					ref="revisionsSidebarDetailRef"
					:collection="collection"
					:primary-key="actualPrimaryKey"
					:version="currentVersion"
					:scope="accountabilityScope"
					@revert="revert"
				/>
				<CommentsSidebarDetail
					v-if="currentVersion === null"
					:collection="collection"
					:primary-key="actualPrimaryKey"
				/>
				<SharesSidebarDetail
					v-if="currentVersion === null"
					:collection="collection"
					:primary-key="actualPrimaryKey"
					:allowed="shareAllowed"
				/>
				<FlowSidebarDetail v-if="currentVersion === null" :manual-flows />
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
	padding-inline: var(--content-padding);
	padding-block: var(--content-padding) var(--content-padding-bottom);
}

.title-loader {
	inline-size: 260px;
}

:deep(.type-title) {
	.render-template {
		img {
			block-size: 20px;
		}
	}
}

.headline-wrapper {
	display: flex;
	align-items: center;
	gap: 0.25rem;
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

		@media (width > 640px) {
			opacity: 1;
		}
	}
}

.headline-wrapper.has-version-menu .headline-breadcrumb {
	@media (max-width: 600px) {
		display: none;
	}
}

.content-split {
	flex-grow: 1;
	block-size: 100%;
	position: relative;
}

.content-split :deep(.sp-start) {
	overflow: auto;
}

.content-split :deep(.sp-end) {
	background-color: var(--theme--background-subdued);
	overflow-y: auto;

	@media (width > 640px) {
		border-inline-start: var(--theme--border-width) solid var(--theme--form--field--input--border-color);
	}
}

.content-split.sp-collapsed :deep(.sp-divider) {
	display: none;
}

.content-split.sp-collapsed :deep(.sp-end) {
	border-inline-start: none;
}
</style>
