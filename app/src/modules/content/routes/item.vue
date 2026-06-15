<script setup lang="ts">
import { translateShortcut, useCollection, useShortcut } from '@directus/composables';
import { VERSION_KEY_DRAFT, VERSION_KEY_PUBLISHED } from '@directus/constants';
import type { AppCollection, Item, PrimaryKey } from '@directus/types';
import { sameOrigin } from '@directus/utils/browser';
import { SplitPanel } from '@directus/vue-split-panel';
import { useHead } from '@unhead/vue';
import { useBreakpoints, useEventListener, useLocalStorage } from '@vueuse/core';
import {
	type ComponentPublicInstance,
	computed,
	nextTick,
	onBeforeUnmount,
	provide,
	ref,
	toRefs,
	unref,
	watch,
} from 'vue';
import { useI18n } from 'vue-i18n';
import { onBeforeRouteUpdate, useRoute, useRouter } from 'vue-router';
import ContentNavigation from '../components/navigation.vue';
import VersionMenu from '../components/version-menu.vue';
import { trackLastAccessedCollection } from '../index';
import ContentNotFound from './not-found.vue';
import { useContextStaging } from '@/ai/composables/use-context-staging';
import { useAiToolsStore } from '@/ai/stores/use-ai-tools';
import VButton from '@/components/v-button.vue';
import VCardActions from '@/components/v-card-actions.vue';
import VCardText from '@/components/v-card-text.vue';
import VCardTitle from '@/components/v-card-title.vue';
import VCard from '@/components/v-card.vue';
import VDialog from '@/components/v-dialog.vue';
import VForm from '@/components/v-form/v-form.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VKbdShortcut from '@/components/v-kbd-shortcut.vue';
import VListItemContent from '@/components/v-list-item-content.vue';
import VListItemHint from '@/components/v-list-item-hint.vue';
import VListItemIcon from '@/components/v-list-item-icon.vue';
import VListItem from '@/components/v-list-item.vue';
import VList from '@/components/v-list.vue';
import VSkeletonLoader from '@/components/v-skeleton-loader.vue';
import { useCollab } from '@/composables/use-collab';
import { useEditsGuard } from '@/composables/use-edits-guard';
import { useFlows } from '@/composables/use-flows';
import { useItem } from '@/composables/use-item';
import { useCollectionPermissions, useItemPermissions } from '@/composables/use-permissions';
import { useTemplateData } from '@/composables/use-template-data';
import { useVersions } from '@/composables/use-versions';
import { useVisualEditing } from '@/composables/use-visual-editing';
import { BREAKPOINTS } from '@/constants';
import { useAutoSave } from '@/modules/content/composables/use-auto-save';
import { useNotificationsStore } from '@/stores/notifications';
import { useUserStore } from '@/stores/user';
import type { ContentVersionMaybeNew, ContentVersionWithType } from '@/types/versions';
import { getDefaultValuesFromFields } from '@/utils/get-default-values-from-fields';
import { getCollectionRoute, getItemRoute } from '@/utils/get-route';
import { mergeItemData } from '@/utils/merge-item-data';
import { pushGroupOptionsDown } from '@/utils/push-group-options-down';
import { renderStringTemplate } from '@/utils/render-string-template';
import { unexpectedError } from '@/utils/unexpected-error';
import { validateItem } from '@/utils/validate-item';
import { PrivateView, PrivateViewHeaderBarActionButton } from '@/views/private';
import CollabIndicatorHeader from '@/views/private/components/collab/CollabIndicatorHeader.vue';
import CommentsSidebarDetail from '@/views/private/components/comments-sidebar-detail.vue';
import ComparisonModal from '@/views/private/components/comparison/comparison-modal.vue';
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
const route = useRoute();

onBeforeRouteUpdate((to, from) => {
	if (to.name !== 'content-singleton') return;
	if (to.params.collection === from.params.collection) return;

	// `beforeEnter` doesn’t re-fire on sibling/param-only navigation. Auto-draft for pristine singletons is handled by the post-load watcher below, since sync route guards can’t detect existing items.
	trackLastAccessedCollection(to);
});

const { collectionRoute, backRoute } = useItemNavigation();

const userStore = useUserStore();
const notificationsStore = useNotificationsStore();

const isCurrentVersionNew = computed(() => currentVersion.value?.id === '+');

const form = ref<ComponentPublicInstance>();

const { collection } = toRefs(props);
const revisionsSidebarDetailRef = ref<InstanceType<typeof RevisionsSidebarDetail> | null>(null);

const { info: collectionInfo, defaults, primaryKeyField, isSingleton, accountabilityScope } = useCollection(collection);

const { deleteAllowed: deleteVersionsAllowed } = useCollectionPermissions('directus_versions');

const { primaryKeyParam, resolvedPrimaryKey, existingPrimaryKey, resolvePrimaryKey } = useResolvePrimaryKey();

const {
	readVersionsAllowed,
	createVersionsAllowed,
	currentVersion,
	versions,
	addVersion,
	updateVersion,
	deleteVersion,
	deleteVersionLoading,
	saveVersion,
	validationErrors: versionValidationErrors,
	publishVersionLoading,
	publishVersion,
	isItemlessVersion,
} = useVersions(collection, isSingleton, resolvedPrimaryKey);

const {
	comparisonModalActive,
	comparableVersion,
	confirmOverwriteActive,
	onVersionPublishCompare,
	onVersionPublishConfirm,
	onVersionPublishWithoutReview,
	confirmOverwrite,
} = usePublishActions();

async function onVersionDelete(versionId: PrimaryKey) {
	const wasItemLess = isItemlessVersion.value;
	await deleteVersion(versionId);

	if (wasItemLess) {
		edits.value = {};
		// Wait for Vue's watcher cascade to flush: deleting the version causes useVersions'
		// watchers to update queryVersionId via useRouteQuery (mode:'push'), which triggers
		// its own router.push. Without nextTick, that push fires after ours and cancels it.
		await nextTick();
		router.push(collectionRoute.value);
	}
}

function handleVersionGone(error: unknown) {
	if (!error || typeof error !== 'object' || !('versionGone' in error)) return false;

	unexpectedError(error, {
		dismissAction: () => {
			edits.value = {};

			if (isItemlessVersion.value) {
				router.push(collectionRoute.value);
			} else {
				currentVersion.value = null;
				refresh();
			}
		},
	});

	return true;
}

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
	getItem,
	validationErrors: itemValidationErrors,
} = useItem(collection, primaryKeyParam, currentVersion, isItemlessVersion);

watch(
	[item, isSingleton, primaryKeyParam],
	([newItem, newIsSingleton, newPKParam]) => resolvePrimaryKey(newItem, newIsSingleton, newPKParam),
	{ immediate: true },
);

watch([isSingleton, resolvedPrimaryKey, collectionInfo], (values) => enterSingletonDraftContext(...values));

const toolsStore = useAiToolsStore();

toolsStore.onSystemToolResult((tool, input) => {
	if (tool === 'items' && input.collection === collection.value && input.action !== 'read') {
		refresh();
		refreshLivePreview();
	}
});

const {
	clearCollidingChanges,
	users: collabUsers,
	connected,
	collabContext,
	collabCollision,
	update: updateCollab,
	discard: discardCollab,
	focused,
	connectionId,
} = useCollab(collection, primaryKeyParam, currentVersion, item, edits, getItem);

const validationErrors = computed(() => {
	if (currentVersion.value === null) return itemValidationErrors.value;
	return versionValidationErrors.value;
});

const {
	collectionPermissions: { createAllowed, revisionsAllowed },
	itemPermissions: { updateAllowed, deleteAllowed, saveAllowed, archiveAllowed, shareAllowed, fields },
} = permissions;

const { templateData } = useTemplateData(collectionInfo, primaryKeyParam);

const { confirmLeave, leaveTo } = useEditsGuard(hasEdits, { compareQuery: ['version', 'versionId'] });
const confirmDelete = ref(false);
const confirmArchive = ref(false);
const confirmDiscard = ref(false);

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
		if (currentVersion.value === null) {
			saveAndStay();
		} else {
			notificationsStore.add({
				title: t('auto_save_enabled'),
				type: 'info',
				icon: 'cloud_done',
			});
		}
	},
	form,
);

useShortcut(
	'meta+shift+s',
	() => {
		if (currentVersion.value !== null) return;
		saveAndAddNew();
	},
	form,
);

useShortcut(
	'meta+alt+p',
	() => {
		if (currentVersion.value !== null && isPublishAllowed.value) {
			onVersionPublishCompare();
		}
	},
	form,
);

useShortcut(
	'meta+alt+shift+p',
	() => {
		if (currentVersion.value !== null && isPublishAllowed.value && !collectionInfo.value?.meta?.singleton) {
			onVersionPublishCompare(true);
		}
	},
	form,
);

useShortcut(
	'meta+alt+shift+enter',
	() => {
		if (currentVersion.value !== null && isPublishAllowed.value) {
			onVersionPublishWithoutReview();
		}
	},
	form,
);

useShortcut(
	'meta+alt+n',
	() => {
		if (canCreateNew.value) createNewItem();
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

	if (isNew.value && currentVersion.value === null) {
		return Object.keys(defaults.value).length > 0 || hasEdits.value;
	}

	return hasEdits.value;
});

const { updateAllowed: updateVersionsAllowed } = useItemPermissions(
	'directus_versions',
	computed(() => currentVersion.value?.id ?? null),
	computed(() => !currentVersion.value),
);

const { applyAutoSwitchPendingEdits, canAutoSwitchToDraft, draftVersion } = useAutoSwitchToDraft();

const {
	autoSaveError,
	resetOpenRevision,
	flush: flushAutoSave,
} = useAutoSave(edits, autoSave, {
	currentVersion,
	updateVersionsAllowed,
	collection,
});

const isPublishAllowed = computed(() => {
	if (currentVersion.value === null) return false;
	if (isCurrentVersionNew.value) return false;
	if (autoSaveError.value !== null) return false;
	return isItemlessVersion.value ? createAllowed.value : updateAllowed.value;
});

const isFormDisabled = computed(() => {
	if (isNew.value) return false;
	if (updateAllowed.value) return false;
	if (currentVersion.value !== null && updateVersionsAllowed.value) return false;
	if (canAutoSwitchToDraft.value) return false;
	return true;
});

const isFormNonEditable = computed(
	() =>
		shouldShowVersioning.value &&
		readVersionsAllowed.value &&
		currentVersion.value === null &&
		!canAutoSwitchToDraft.value,
);

const disabledOptions = computed(() => {
	if (!createAllowed.value) return ['save-and-add-new', 'save-as-copy'];
	if (isNew.value) return ['save-as-copy'];
	return [];
});

const currentVersionId = computed(() => currentVersion.value?.id ?? null);

watch(currentVersionId, async () => {
	resetOpenRevision();
	const autoSwitchPendingEdits = applyAutoSwitchPendingEdits();
	edits.value = autoSwitchPendingEdits ?? {};
	await refreshLivePreview();
});

const previewTemplate = computed(() => collectionInfo.value?.meta?.preview_url ?? '');

const { templateData: previewData, fetchTemplateValues } = useTemplateData(collectionInfo, primaryKeyParam, {
	template: previewTemplate,
	injectData: computed(() => ({ $version: currentVersion.value?.key ?? VERSION_KEY_PUBLISHED })),
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
const livePreviewEnforceDefault = ref(false);

const breakpoints = useBreakpoints(BREAKPOINTS);
const isMobile = breakpoints.smallerOrEqual('sm');
const livePreviewSizeMinSize = computed(() => (isMobile.value ? 0 : 20));

const livePreviewActive = computed(
	() => !!collectionInfo.value?.meta?.preview_url && !unref(isNew) && livePreviewMode.value === 'split',
);

const livePreviewCollapsed = computed({
	get() {
		return !livePreviewActive.value;
	},
	set(value: boolean) {
		if (!value) livePreviewEnforceDefault.value = true;
		livePreviewMode.value = value ? null : 'split';
	},
});

const livePreviewSize = computed({
	get() {
		if (isMobile.value || livePreviewFullWidth.value) {
			return livePreviewActive.value ? 100 : 0;
		}

		const storedValue = livePreviewSizeStorage.value || livePreviewSizeDefault;

		// Enforce default size when the preview is below the minimum size
		if (livePreviewEnforceDefault.value && storedValue <= livePreviewSizeMinSize.value) {
			return livePreviewSizeDefault;
		}

		return storedValue;
	},
	set(value: number) {
		if (isMobile.value) return;

		// Remove default size enforcement once the preview is larger than the minimum size
		if (livePreviewEnforceDefault.value && value > livePreviewSizeMinSize.value) {
			livePreviewEnforceDefault.value = false;
		}

		// Auto-toggle full-width based on drag position
		if (value >= 95 && !livePreviewFullWidth.value) {
			livePreviewFullWidth.value = true;
		} else if (value < 95 && livePreviewFullWidth.value) {
			livePreviewFullWidth.value = false;
		}

		livePreviewSizeStorage.value = value;
	},
});

provide('live-preview-active', livePreviewActive);

const { visualEditingEnabled, visualModuleEnabled } = useVisualEditing({
	previewUrl,
	isNew,
});

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
	primaryKey: existingPrimaryKey,
	location: 'item',
	hasEdits,
	onRefreshCallback: refresh,
});

provideRunManualFlow();

const { stageVisualElement } = useContextStaging();

useEventListener('message', (event) => {
	if (!sameOrigin(event.origin, window.location.href)) return;
	if (event.source !== popupWindow) return;

	if (event.data === 'refresh') refresh();

	if (event.data?.action === 'stage-visual-element') {
		stageVisualElement(event.data.data.element);
	}
});

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

onBeforeUnmount(() => {
	if (popupWindow) popupWindow.close();
});

async function autoSave(forceNewRevision: boolean) {
	try {
		if (forceNewRevision) {
			await saveVersion(edits, item);
			if (!isNew.value) revisionsSidebarDetailRef.value?.refresh?.();
		} else {
			await saveVersion(edits, item, { patchRevision: true });
		}

		await refreshLivePreview();
	} catch (error) {
		// Throw anyway if not a `versionGone` error
		if (!handleVersionGone(error)) throw error;
	}
}

async function saveAndStay() {
	if (isSavable.value === false) return;

	try {
		const savedItem: Record<string, any> = await save();

		if (primaryKeyParam.value === '+') {
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
	if (currentVersion.value !== null) return;

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

const canCreateNew = computed(() => {
	if (currentVersion.value === null) return false;
	if (!createAllowed.value) return false;
	if (isCurrentVersionNew.value) return false;
	if (collectionInfo.value?.meta?.singleton) return false;
	return !hasEdits.value;
});

function createNewItem() {
	router.push(getItemRoute(props.collection, '+', VERSION_KEY_DRAFT));
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
	if (collabUsers.value.length > 1) {
		confirmDiscard.value = true;
	} else {
		discardAndStayConfirmed();
	}
}

function discardAndStayConfirmed() {
	discardCollab();
	confirmLeave.value = false;
	confirmDiscard.value = false;
}

function revert(values: Record<string, any>) {
	edits.value = {
		...edits.value,
		...values,
	};
}

const shouldShowVersioning = computed(() => {
	if (!collectionInfo.value?.meta?.versioning) return false;
	return true;
});

function enterSingletonDraftContext(
	newIsSingleton: boolean,
	newResolvedPK: PrimaryKey | null,
	newCollectionInfo: AppCollection | null,
) {
	if (!newCollectionInfo?.meta?.versioning) return;
	if (!newIsSingleton) return;
	if (route.query.version) return;
	if (newResolvedPK !== '+') return;

	router.replace({ ...route, query: { ...route.query, version: VERSION_KEY_DRAFT } });
}

function useResolvePrimaryKey() {
	const { primaryKey: primaryKeyParam } = toRefs(props);

	/**
	 * Collection Item PK: ID or '+' (new item).
	 * Singleton Item PK: ID or '+' (new item) or `null` (not-yet loaded).
	 */
	const resolvedPrimaryKey = ref<PrimaryKey | null>(primaryKeyParam.value);
	const existingPrimaryKey = computed(() => (resolvedPrimaryKey.value === '+' ? null : resolvedPrimaryKey.value));

	return {
		primaryKeyParam,
		resolvedPrimaryKey,
		existingPrimaryKey,
		resolvePrimaryKey,
	};

	function resolvePrimaryKey(newItem: Item | null, newIsSingleton: boolean, newPrimaryKeyParam: PrimaryKey | null) {
		if (newIsSingleton) {
			if (!newItem) return;
			// Note: After fetching a singleton item, `newItem` will be `{ id: null }` if it hasn’t been created yet.

			const pkField = primaryKeyField.value?.field;
			resolvedPrimaryKey.value = (pkField ? (newItem[pkField] ?? '+') : '+') as PrimaryKey;
			return;
		}

		resolvedPrimaryKey.value = newPrimaryKeyParam;
	}
}

function useItemNavigation() {
	const collectionRoute = computed(() => {
		const bookmark = route.query.bookmark;
		const version = route.query.version === VERSION_KEY_DRAFT ? VERSION_KEY_DRAFT : undefined;

		return router.resolve({
			name: 'content-collection',
			params: { collection: props.collection },
			query: { bookmark, version },
		}).fullPath;
	});

	const backRoute = computed(() => collectionRoute.value);

	return { collectionRoute, backRoute };
}

function usePublishActions() {
	const comparisonModalActive = ref(false);
	const confirmOverwriteActive = ref(false);
	const pendingOverwriteHash = ref<string | null>(null);
	const quitAfterPublish = ref(false);

	const comparableVersion = computed(() => {
		if (currentVersion.value === null || currentVersion.value.id === '+') return null;
		return currentVersion.value as ContentVersionWithType;
	});

	async function onVersionPublishCompare(quit = false) {
		if (!(await flushAutoSave())) return;

		quitAfterPublish.value = quit;

		if (isItemlessVersion.value) {
			if (!runClientValidation()) return;

			try {
				await publishItemlessAndNavigate(currentVersion.value!.id, quit);
			} catch (error) {
				handleVersionGone(error);
			} finally {
				quitAfterPublish.value = false;
			}

			return;
		}

		comparisonModalActive.value = true;
	}

	async function onVersionPublishConfirm(opts: {
		versionId: string;
		mainHash: string;
		fields: string[];
		deleteOnPublish: boolean;
	}) {
		if (!runClientValidation()) {
			comparisonModalActive.value = false;
			return;
		}

		try {
			await publishVersion(opts.versionId, { mainHash: opts.mainHash, fields: opts.fields });

			if (versionValidationErrors.value.length) {
				comparisonModalActive.value = false;
				return;
			}

			if (quitAfterPublish.value) {
				router.push(collectionRoute.value);
				if (opts.deleteOnPublish) deleteVersion(opts.versionId);
				return;
			}

			if (opts.deleteOnPublish) await deleteVersion(opts.versionId);

			finalizePublishedItem();
		} catch (error) {
			handleVersionGone(error);
		} finally {
			comparisonModalActive.value = false;
			quitAfterPublish.value = false;
		}
	}

	async function onVersionPublishWithoutReview() {
		if (publishVersionLoading.value) return;
		if (!currentVersion.value || currentVersion.value.id === '+') return;
		if (!(await flushAutoSave())) return;
		if (!runClientValidation()) return;

		const version = currentVersion.value as ContentVersionWithType;

		try {
			if (isItemlessVersion.value) {
				await publishItemlessAndNavigate(version.id, false);
				return;
			}

			const newItemKey = await publishVersion(version.id, { mainHash: version.hash });
			if (!newItemKey) return;

			if (deleteVersionsAllowed.value) await deleteVersion(version.id);

			finalizePublishedItem();
		} catch (error) {
			if (error && typeof error === 'object' && 'versionDrift' in error) {
				pendingOverwriteHash.value = (error as unknown as { mainHash: string }).mainHash;
				confirmOverwriteActive.value = true;
				return;
			}

			handleVersionGone(error);
		}
	}

	async function confirmOverwrite() {
		if (!currentVersion.value || currentVersion.value.id === '+') return;
		if (!pendingOverwriteHash.value) return;

		const version = currentVersion.value as ContentVersionWithType;
		const mainHash = pendingOverwriteHash.value;

		try {
			const newItemKey = await publishVersion(version.id, { mainHash });
			if (!newItemKey) return;

			if (deleteVersionsAllowed.value) await deleteVersion(version.id);

			finalizePublishedItem();
		} catch (error) {
			handleVersionGone(error);
		} finally {
			confirmOverwriteActive.value = false;
			pendingOverwriteHash.value = null;
		}
	}

	function runClientValidation(): boolean {
		const defaultValues = getDefaultValuesFromFields(fields);
		const payloadToValidate = mergeItemData(defaultValues.value, item.value ?? {}, edits.value);
		const fieldsToValidate = pushGroupOptionsDown(fields.value);
		const clientErrors = validateItem(payloadToValidate, fieldsToValidate, false, false, currentVersion.value);
		versionValidationErrors.value = clientErrors;
		return clientErrors.length === 0;
	}

	async function publishItemlessAndNavigate(versionId: PrimaryKey, quit: boolean) {
		const newItemKey = await publishVersion(versionId, {});
		if (!newItemKey) return;

		if (isSingleton.value) router.push(getCollectionRoute(props.collection));
		else if (quit) router.push(collectionRoute.value);
		else router.replace(getItemRoute(props.collection, newItemKey));

		deleteVersion(versionId);
	}

	function finalizePublishedItem() {
		currentVersion.value = null;
		refresh();
		revisionsSidebarDetailRef.value?.refresh?.();
	}

	return {
		comparisonModalActive,
		comparableVersion,
		confirmOverwriteActive,
		onVersionPublishCompare,
		onVersionPublishConfirm,
		onVersionPublishWithoutReview,
		confirmOverwrite,
	};
}

function useAutoSwitchToDraft() {
	const autoSwitchPendingEdits = ref<Item>({});
	const draftVersion = computed(() => versions.value.find((version) => version.key === VERSION_KEY_DRAFT)!);
	const notificationsStore = useNotificationsStore();

	const canAutoSwitchToDraft = computed(() => {
		if (isNew.value) return false;
		if (!shouldShowVersioning.value) return false;
		if (!readVersionsAllowed.value) return false;
		if (currentVersion.value !== null) return false;
		if (hasVersionEdits(draftVersion.value)) return false;
		if (draftVersion.value?.id === '+') return createVersionsAllowed.value;
		return updateVersionsAllowed.value || createVersionsAllowed.value;
	});

	watch(hasEdits, async (newHasEdits, oldHasEdits) => {
		if (!newHasEdits || oldHasEdits) return;
		if (!canAutoSwitchToDraft.value) return;
		if (!draftVersion.value) return;

		stashAutoSwitchPendingEdits();

		const navigationFailure = await router.replace({
			...route,
			query: { ...route.query, version: VERSION_KEY_DRAFT },
		});

		if (navigationFailure) return;

		notificationsStore.add({
			title: t('editing_draft_version'),
			icon: 'edit',
		});
	});

	return {
		canAutoSwitchToDraft,
		draftVersion,
		applyAutoSwitchPendingEdits,
	};

	function applyAutoSwitchPendingEdits() {
		if (!Object.keys(autoSwitchPendingEdits.value).length) return null;

		const editsToApply = { ...autoSwitchPendingEdits.value };
		autoSwitchPendingEdits.value = {};

		return editsToApply;
	}

	function stashAutoSwitchPendingEdits() {
		autoSwitchPendingEdits.value = { ...edits.value };
		edits.value = {};
	}

	function hasVersionEdits(version: ContentVersionMaybeNew | null) {
		if (!version || version?.id === '+') return false;
		return (version as ContentVersionWithType).delta !== null;
	}
}
</script>

<template>
	<ContentNotFound
		v-if="error || !collectionInfo || (collectionInfo?.meta?.singleton === true && primaryKeyParam !== null)"
	/>

	<PrivateView
		v-else
		:title
		:show-back="!collectionInfo.meta?.singleton"
		:back-to="backRoute"
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

		<template v-if="shouldShowVersioning" #title-outer:append>
			<VersionMenu
				:collection="collection"
				:primary-key="resolvedPrimaryKey"
				:has-edits="hasEdits"
				:current-version="currentVersion"
				:versions="versions"
				:delete-version-loading="deleteVersionLoading"
				@add="addVersion"
				@update="updateVersion"
				@delete="onVersionDelete"
				@switch="currentVersion = $event"
			/>
		</template>

		<template #actions:prepend>
			<CollabIndicatorHeader
				:model-value="collabUsers"
				:connected="connected"
				:focuses="focused"
				:current-connection="connectionId"
			/>
		</template>

		<template #actions>
			<PrivateViewHeaderBarActionButton
				v-if="previewUrl"
				:tooltip="$t(livePreviewMode === null ? 'live_preview.enable' : 'live_preview.disable')"
				icon="visibility"
				variant="ghost"
				:active="!!livePreviewMode"
				@click="livePreviewCollapsed = !livePreviewCollapsed"
			/>

			<VDialog
				v-if="!isNew && currentVersion === null"
				v-model="confirmDelete"
				:disabled="deleteAllowed === false"
				@esc="confirmDelete = false"
				@apply="deleteAndQuit"
			>
				<template #activator="{ on }">
					<PrivateViewHeaderBarActionButton
						v-if="collectionInfo.meta && collectionInfo.meta.singleton === false"
						:tooltip="deleteAllowed ? $t('delete_label') : $t('not_allowed')"
						icon="delete"
						kind="danger"
						variant="ghost"
						:disabled="item === null || deleteAllowed !== true"
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

			<VDialog
				v-if="collectionInfo.meta && collectionInfo.meta.archive_field && !isNew && currentVersion === null"
				v-model="confirmArchive"
				:disabled="archiveAllowed === false"
				@esc="confirmArchive = false"
				@apply="toggleArchive"
			>
				<template #activator="{ on }">
					<PrivateViewHeaderBarActionButton
						v-if="collectionInfo.meta && collectionInfo.meta.singleton === false"
						:tooltip="archiveTooltip"
						:icon="isArchived ? 'unarchive' : 'archive'"
						kind="warning"
						variant="ghost"
						:disabled="item === null || archiveAllowed !== true"
						@click="on"
					/>
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
		</template>

		<template #actions:primary>
			<template v-if="shouldShowVersioning && readVersionsAllowed">
				<PrivateViewHeaderBarActionButton
					v-if="currentVersion === null && !canAutoSwitchToDraft"
					:label="$t('edit')"
					icon="edit"
					@click="currentVersion = draftVersion"
				/>

				<template v-else>
					<PrivateViewHeaderBarActionButton
						:label="$t('publish')"
						:tooltip="translateShortcut(['meta', 'alt', 'p'])"
						icon="public"
						:disabled="!isPublishAllowed"
						@click="onVersionPublishCompare()"
					>
						<template v-if="collectionInfo.meta" #split-menu>
							<VList>
								<VListItem
									v-if="collectionInfo.meta.singleton !== true"
									clickable
									@click="onVersionPublishCompare(true)"
								>
									<VListItemIcon><VIcon name="public" /></VListItemIcon>
									<VListItemContent>{{ $t('publish_and_quit') }}</VListItemContent>
									<VListItemHint>{{ translateShortcut(['meta', 'alt', 'shift', 'p']) }}</VListItemHint>
								</VListItem>
								<VListItem
									clickable
									:disabled="!isPublishAllowed || isItemlessVersion"
									@click="onVersionPublishWithoutReview()"
								>
									<VListItemIcon><VIcon name="bolt" /></VListItemIcon>
									<VListItemContent>{{ $t('publish_without_review') }}</VListItemContent>
									<VListItemHint>{{ translateShortcut(['meta', 'alt', 'shift', 'enter']) }}</VListItemHint>
								</VListItem>
								<VListItem
									v-if="collectionInfo.meta.singleton !== true"
									clickable
									:disabled="!canCreateNew"
									@click="createNewItem()"
								>
									<VListItemIcon><VIcon name="add" /></VListItemIcon>
									<VListItemContent>{{ $t('create_new') }}</VListItemContent>
									<VListItemHint>{{ translateShortcut(['meta', 'alt', 'n']) }}</VListItemHint>
								</VListItem>
							</VList>
						</template>
					</PrivateViewHeaderBarActionButton>
				</template>
			</template>

			<template v-else>
				<PrivateViewHeaderBarActionButton
					:label="$t('save')"
					:tooltip="!saveAllowed ? $t('not_allowed') : undefined"
					icon="check"
					:loading="saving"
					:disabled="!isSavable"
					@click="saveAndQuit()"
				>
					<template v-if="collectionInfo.meta && collectionInfo.meta.singleton !== true" #split-menu>
						<SaveOptions
							:disabled-options="disabledOptions"
							@save-and-stay="saveAndStay"
							@save-and-add-new="saveAndAddNew"
							@save-as-copy="saveAsCopyAndNavigate"
							@discard-and-stay="discardAndStay"
						/>
					</template>
				</PrivateViewHeaderBarActionButton>
			</template>
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
			:min-size="livePreviewSizeMinSize"
			:max-size="isMobile || livePreviewFullWidth ? 100 : 80"
			:snap-points="[livePreviewSizeDefault]"
			:transition-duration="150"
			:class="['content-split', { 'full-width': livePreviewFullWidth }]"
			:disabled="isMobile"
		>
			<template #start>
				<VForm
					ref="form"
					v-model="edits"
					:autofocus="isNew"
					:disabled="isFormDisabled || isFormNonEditable"
					:loading="loading"
					:initial-values="item"
					:fields="fields"
					:non-editable="isFormNonEditable"
					:primary-key="resolvedPrimaryKey ?? undefined"
					:collab-context="collabContext"
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
					:version="currentVersion"
					:can-enable-visual-editing="visualEditingEnabled"
					:show-open-in-visual-editor="visualModuleEnabled"
					:is-full-width="livePreviewFullWidth"
					@new-window="livePreviewMode = 'popup'"
					@exit-full-width="livePreviewFullWidth = false"
					@saved="refresh"
				>
					<template #display-options>
						<VListItem clickable @click="livePreviewFullWidth = true">
							<VListItemIcon><VIcon name="width_full" /></VListItemIcon>
							<VListItemContent>{{ $t('full_width') }}</VListItemContent>
						</VListItem>
					</template>
				</LivePreview>
			</template>
		</SplitPanel>

		<ComparisonModal
			:model-value="collabCollision !== undefined"
			:collection="collection"
			:primary-key="resolvedPrimaryKey ?? '+'"
			:current-collab="collabCollision"
			:collab-context="collabContext"
			mode="collab"
			@confirm="updateCollab"
			@cancel="clearCollidingChanges"
		/>

		<ComparisonModal
			v-if="comparableVersion"
			v-model="comparisonModalActive"
			:delete-versions-allowed="deleteVersionsAllowed"
			:collection="collection"
			:primary-key="resolvedPrimaryKey ?? '+'"
			mode="version"
			:current-version="comparableVersion"
			:publish-version-loading="publishVersionLoading"
			@publish="onVersionPublishConfirm"
			@cancel="comparisonModalActive = false"
		/>

		<VDialog v-model="confirmOverwriteActive" @esc="confirmOverwriteActive = false" @apply="confirmOverwrite">
			<VCard>
				<VCardTitle>{{ $t('published_item_has_changed') }}</VCardTitle>
				<VCardText>{{ $t('published_item_has_changed_copy') }}</VCardText>
				<VCardActions>
					<VButton secondary @click="confirmOverwriteActive = false">
						{{ $t('cancel') }}
					</VButton>
					<VButton :loading="publishVersionLoading" @click="confirmOverwrite">
						{{ $t('publish_anyway') }}
					</VButton>
				</VCardActions>
			</VCard>
		</VDialog>

		<VDialog v-model="confirmLeave" @esc="confirmLeave = false" @apply="discardAndLeave">
			<VCard v-if="!connected || collabUsers.length <= 1">
				<VCardTitle>{{ $t('unsaved_changes') }}</VCardTitle>
				<VCardText>{{ $t('unsaved_changes_copy') }}</VCardText>
				<VCardActions>
					<VButton secondary @click="discardAndLeave">
						{{ $t('discard_changes') }}
					</VButton>
					<VButton @click="confirmLeave = false">{{ $t('keep_editing') }}</VButton>
				</VCardActions>
			</VCard>
			<VCard v-else>
				<VCardTitle>{{ $t('unsaved_changes_collab') }}</VCardTitle>
				<VCardText>{{ $t('unsaved_changes_copy_collab') }}</VCardText>
				<VCardActions>
					<VButton secondary @click="discardAndLeave">
						{{ $t('leave_page') }}
					</VButton>
					<VButton @click="confirmLeave = false">{{ $t('keep_editing') }}</VButton>
				</VCardActions>
			</VCard>
		</VDialog>

		<VDialog v-model="confirmDiscard" @esc="confirmDiscard = false">
			<VCard>
				<VCardTitle>{{ $t('discard_all_changes') }}</VCardTitle>
				<VCardText>{{ $t('discard_changes_copy_collab') }}</VCardText>
				<VCardActions>
					<VButton secondary @click="discardAndStayConfirmed">
						{{ $t('discard_changes') }}
					</VButton>
					<VButton @click="confirmDiscard = false">{{ $t('keep_editing') }}</VButton>
				</VCardActions>
			</VCard>
		</VDialog>

		<template #sidebar>
			<template v-if="isNew === false && resolvedPrimaryKey">
				<RevisionsSidebarDetail
					v-if="revisionsAllowed && accountabilityScope === 'all'"
					ref="revisionsSidebarDetailRef"
					:collection="collection"
					:primary-key="resolvedPrimaryKey"
					:version="currentVersion"
					:scope="accountabilityScope"
					@revert="revert"
				/>
				<CommentsSidebarDetail
					v-if="currentVersion === null"
					:collection="collection"
					:primary-key="resolvedPrimaryKey"
				/>
				<SharesSidebarDetail
					v-if="currentVersion === null"
					:collection="collection"
					:primary-key="resolvedPrimaryKey"
					:allowed="shareAllowed"
				/>
				<FlowSidebarDetail v-if="currentVersion === null" :manual-flows />
			</template>
		</template>

		<FlowDialogs v-bind="flowDialogsContext" />
	</PrivateView>
</template>

<style lang="scss" scoped>
@use '@/styles/mixins';

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
	inline-size: 14.625rem;
}

:deep(.type-title) {
	min-inline-size: 0;
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

	@include mixins.breakpoint-up('sm') {
		border-inline-start: var(--theme--border-width) solid var(--theme--form--field--input--border-color);
	}
}

.content-split.sp-collapsed :deep(.sp-divider) {
	display: none;
}

.content-split.sp-collapsed :deep(.sp-end) {
	border-inline-start: none;
}

.content-split.full-width :deep(.sp-end) {
	border-inline-start: none;
}
</style>
