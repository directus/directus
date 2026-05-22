<script setup lang="ts">
import { useCollection } from '@directus/composables';
import type { ContentVersion, Item, PrimaryKey } from '@directus/types';
import {
	buildPayload,
	findParentInitialValue,
	getEndpoint,
	getParentInitialValueFields,
	resolveWriteTarget,
	WRITE_TARGET_REFUSAL,
	type WriteTargetRefusalToken,
} from '@directus/utils';
import { sameOrigin } from '@directus/utils/browser';
import type {
	AddToContextData,
	CheckFieldAccessData,
	EditConfig,
	HighlightElementData,
	SavedData,
	SendAction,
	VisualEditingTheme,
} from '@directus/visual-editing/types';
import { useEventListener } from '@vueuse/core';
import { cloneDeep, isEqual } from 'lodash';
import { computed, nextTick, onUnmounted, ref, toRaw, useTemplateRef, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import type { EditData, NavigationData, ReceiveData } from '../types';
import { useContextStaging } from '@/ai/composables/use-context-staging';
import { useAiStore } from '@/ai/stores/use-ai';
import { useAiContextStore } from '@/ai/stores/use-ai-context';
import { useAiToolsStore } from '@/ai/stores/use-ai-tools';
import api from '@/api';
import VButton from '@/components/v-button.vue';
import { useCollectionPermissions } from '@/composables/use-permissions';
import { useVersionGate, type VersionGateParentScope } from '@/composables/use-version-gate';
import { useCollectionsStore } from '@/stores/collections';
import { useFieldsStore } from '@/stores/fields';
import { useNotificationsStore } from '@/stores/notifications';
import { usePermissionsStore } from '@/stores/permissions';
import { useRelationsStore } from '@/stores/relations';
import { useServerStore } from '@/stores/server';
import { useSettingsStore } from '@/stores/settings';
import { useUserStore } from '@/stores/user';
import { ensureVersionId } from '@/utils/ensure-version-id';
import { getCollectionRoute, getItemRoute } from '@/utils/get-route';
import { getSchemaOverview } from '@/utils/get-schema-overview';
import { notify } from '@/utils/notify';
import { unexpectedError } from '@/utils/unexpected-error';
import { PrivateViewHeaderBarActionButton } from '@/views/private';
import OverlayItem from '@/views/private/components/overlay-item.vue';

const {
	frameSrc,
	frameEl,
	showEditableElements,
	version,
	parentScope,
	switchVersion,
	hasUnsavedEdits: parentHasUnsavedEdits = false,
} = defineProps<{
	frameSrc: string;
	frameEl?: HTMLIFrameElement;
	showEditableElements?: boolean;
	version: Pick<ContentVersion, 'key' | 'name'> | null;
	parentScope?: VersionGateParentScope;
	switchVersion?: (versionKey: string) => void | Promise<void>;
	hasUnsavedEdits?: boolean;
}>();

const emit = defineEmits<{
	navigation: [data: NavigationData];
	saved: [data: { collection: string; primaryKey: PrimaryKey }];
}>();

const { t } = useI18n();

const writeTargetRefusalMessageKeys = {
	[WRITE_TARGET_REFUSAL.VERSIONING_REQUIRED]: 'write_target_refusal.versioning_required',
	[WRITE_TARGET_REFUSAL.NO_PARENT_CONTEXT]: 'write_target_refusal.no_parent_context',
	[WRITE_TARGET_REFUSAL.NO_PARENT_PATH]: 'write_target_refusal.no_parent_path',
	[WRITE_TARGET_REFUSAL.MULTI_RELATION]: 'write_target_refusal.multi_relation',
	[WRITE_TARGET_REFUSAL.RELATED_NOT_FOUND]: 'write_target_refusal.related_not_found',
	[WRITE_TARGET_REFUSAL.STALE_ATTACHMENT]: 'write_target_refusal.stale_attachment',
} satisfies Record<WriteTargetRefusalToken, string>;

const {
	collection,
	primaryKey,
	fields,
	mode,
	position,
	initialValues,
	isNew,
	edits,
	editOverlayActive,
	itemRoute,
	onClickEdit,
	guardVersionSwitch,
} = useItemWithEdits();

const { sendSaved, sendHighlightElement } = useWebsiteFrame({ onClickEdit, guardVersionSwitch });

useVisualEditingAi({ sendSaved, sendHighlightElement });

// Clear highlight when edit overlay closes
watch(editOverlayActive, (isActive) => {
	if (!isActive) {
		sendHighlightElement({ key: null });
	}
});

function useWebsiteFrame({
	onClickEdit,
	guardVersionSwitch,
}: {
	onClickEdit: (data: unknown) => void;
	guardVersionSwitch: (
		collection: string,
		effectiveParentScope?: VersionGateParentScope | null,
	) => Promise<string | false>;
}) {
	const serverStore = useServerStore();
	const settingsStore = useSettingsStore();
	const userStore = useUserStore();
	const permissionsStore = usePermissionsStore();
	const collectionsStore = useCollectionsStore();
	const contextStore = useAiContextStore();
	const { stageVisualElement } = useContextStaging();

	const {
		readAllowed: readVersionsAllowed,
		createAllowed: createVersionsAllowed,
		updateAllowed: updateVersionsAllowed,
	} = useCollectionPermissions('directus_versions');

	useEventListener('message', (event) => {
		if (!sameOrigin(event.origin, frameSrc)) {
			return;
		}

		const { action = null, data = null }: ReceiveData = event.data;

		if (action === 'connect') {
			sendConfirm();
			if (showEditableElements) sendShowEditableElements(true);
			contextStore.syncVisualElementContextUrl(frameSrc);
		}

		if (action === 'checkFieldAccess') receiveCheckFieldAccess(data);

		if (action === 'navigation') receiveNavigation(data);

		if (action === 'edit') onClickEdit(data);

		if (action === 'addToContext') void receiveAddToContext(data);
	});

	watch(
		() => showEditableElements,
		(newValue, oldValue) => {
			if (newValue !== oldValue) sendShowEditableElements(newValue);
		},
	);

	return { sendSaved, sendHighlightElement };

	function receiveNavigation(data: unknown) {
		const { url, title } = data as NavigationData;
		if (url === undefined || title === undefined) return;

		emit('navigation', { url, title });
	}

	function receiveCheckFieldAccess(data: unknown) {
		const elements = data as CheckFieldAccessData[];
		const canEditVersions = readVersionsAllowed.value && (createVersionsAllowed.value || updateVersionsAllowed.value);

		if (version && !userStore.isAdmin && !canEditVersions) {
			send('activateElements', []);
			return;
		}

		const permittedKeys = elements.filter((element) => hasAnyUpdatableField(element)).map(({ key }) => key);
		send('activateElements', permittedKeys);
	}

	function hasAnyUpdatableField({ collection, item, fields }: CheckFieldAccessData) {
		if (item == null || item === '') return false;

		const collectionInfo = collectionsStore.getCollection(collection);
		if (!collectionInfo) return false;

		if (version && !collectionInfo.meta?.versioning && !parentScopeHasVersioning()) return false;

		if (userStore.isAdmin) return true;

		const permission = permissionsStore.getPermission(collection, 'update');
		if (!permission || permission.access === 'none') return false;

		if (fields.length && permission.fields && !permission.fields.includes('*')) {
			if (!fields.some((field) => permission.fields!.includes(field))) return false;
		}

		return true;
	}

	function parentScopeHasVersioning() {
		if (!parentScope) return false;
		return Boolean(collectionsStore.getCollection(parentScope.collection)?.meta?.versioning);
	}

	function send(action: SendAction, data: unknown) {
		frameEl?.contentWindow?.postMessage({ action, data }, frameSrc);
	}

	function sendConfirm() {
		const aiEnabled = serverStore.info.ai_enabled && settingsStore.availableAiProviders.length > 0;

		send('confirm', {
			aiEnabled,
			theme: getTheme(),
			messages: {
				edit: t('edit'),
				addToContext: t('add_to_ai_context'),
			},
		});
	}

	function getTheme(): VisualEditingTheme {
		const style = getComputedStyle(document.documentElement);

		return {
			primaryColor: read('--theme--primary'),
			primaryAccentColor: read('--theme--primary-accent'),
			borderRadius: read('--theme--border-radius'),
			buttonSize: resolveButtonHeightFromDom(),
			focusRingWidth: read('--focus-ring-width'),
			focusRingOffset: read('--focus-ring-offset'),
		};

		function read(name: string) {
			return style.getPropertyValue(name).trim() || undefined;
		}

		function resolveButtonHeightFromDom() {
			const probe = document.createElement('div');
			probe.style.cssText = 'position:absolute;visibility:hidden;pointer-events:none;height:var(--button-height-xs);';
			document.body.append(probe);
			const size = getComputedStyle(probe).height || undefined;
			probe.remove();
			return size;
		}
	}

	function sendShowEditableElements(show: boolean) {
		send('showEditableElements', show);
	}

	function sendSaved(data: SavedData) {
		send('saved', data);
	}

	function sendHighlightElement(data: HighlightElementData) {
		send('highlightElement', data);
	}

	async function receiveAddToContext(data: unknown) {
		const { key, editConfig, rect } = data as AddToContextData;
		const effectiveParentScope = parentScope ?? null;

		if (!key || !editConfig?.collection || editConfig.item == null) return;

		const effectiveVersionKey = await guardVersionSwitch(editConfig.collection, effectiveParentScope);
		if (effectiveVersionKey === false) return;

		stageVisualElement({
			key,
			collection: editConfig.collection,
			item: editConfig.item,
			fields: editConfig.fields,
			...(effectiveVersionKey ? { version: effectiveVersionKey } : {}),
			...(effectiveVersionKey && effectiveParentScope
				? {
						parent: {
							collection: effectiveParentScope.collection,
							item: effectiveParentScope.key,
							version: effectiveVersionKey,
						},
					}
				: {}),
			rect,
		});
	}
}

function useVisualEditingAi({
	sendSaved,
	sendHighlightElement,
}: {
	sendSaved: (data: SavedData) => void;
	sendHighlightElement: (data: HighlightElementData) => void;
}) {
	const aiStore = useAiStore();
	const contextStore = useAiContextStore();
	const toolsStore = useAiToolsStore();
	let savedTimer: ReturnType<typeof setTimeout> | null = null;

	// Any non-read mutation should trigger a preview refresh
	const unsubscribeItemsResult = toolsStore.onSystemToolResult((tool, input) => {
		if (tool !== 'items') return;
		if (input.action === 'read') return;

		if (savedTimer) clearTimeout(savedTimer);

		savedTimer = setTimeout(() => {
			sendSaved({ key: '', collection: '', item: null, payload: {} });

			emit('saved', {
				collection: parentScope?.collection ?? '',
				primaryKey: parentScope?.key ?? '',
			});

			savedTimer = null;
		}, 250);
	});

	const unsubscribeHighlight = aiStore.onVisualElementHighlight((data) => {
		if (data === null) {
			sendHighlightElement({ key: null });
		} else {
			const payload: HighlightElementData = {
				collection: data.collection,
				item: data.item,
			};

			if (data.fields) {
				const rawFields = Array.from(toRaw(data.fields)).filter((field) => typeof field === 'string');

				if (rawFields.length > 0) {
					payload.fields = rawFields;
				}
			}

			sendHighlightElement(payload);
		}
	});

	onUnmounted(() => {
		if (savedTimer) clearTimeout(savedTimer);
		unsubscribeItemsResult.off();
		unsubscribeHighlight.off();
		contextStore.clearVisualElementContext();
	});
}

function useItemWithEdits() {
	const edits = ref<Record<string, any>>({});
	const saving = ref(false);
	const editOverlayActive = ref(false);
	const msgKey = ref('');
	const collection = ref<EditConfig['collection']>('');
	const primaryKey = ref<PrimaryKey>('');
	const fields = ref<EditConfig['fields']>([]);
	const availableModes: EditConfig['mode'][] = ['drawer', 'modal', 'popover'];
	const mode = ref<EditConfig['mode']>('drawer');
	const position = ref<Pick<DOMRect, 'top' | 'left' | 'width' | 'height'>>({ top: 0, left: 0, width: 0, height: 0 });
	const initialValues = ref<Item | null>(null);
	const isNew = computed(() => primaryKey.value === '+');
	const itemEndpoint = computed(getItemEndpoint);
	const itemRoute = computed(getContentRoute);
	const notificationsStore = useNotificationsStore();
	const collectionsStore = useCollectionsStore();
	const fieldsStore = useFieldsStore();
	const relationsStore = useRelationsStore();
	const { info: collectionInfo } = useCollection(collection);

	const editingLayerEl = useTemplateRef<HTMLElement>('editing-layer');
	const hasOverlayEdits = computed(() => Object.keys(edits.value).length > 0);
	const hasVersionSwitchEdits = computed(() => parentHasUnsavedEdits || hasOverlayEdits.value);

	const versionGate = useVersionGate({
		currentVersion: computed(() => version),
		parentScope: computed(() => parentScope ?? null),
		hasUnsavedEdits: hasVersionSwitchEdits,
		switchTo: async (versionKey) => {
			await switchVersion?.(versionKey);
		},
	});

	watch(edits, (newEdits) => {
		const hasEdits = Object.keys(newEdits)?.length;
		if (!hasEdits || saving.value) return;

		void savePendingEdits();
	});

	return {
		collection,
		primaryKey,
		fields,
		mode,
		position,
		initialValues,
		isNew,
		edits,
		editOverlayActive,
		itemRoute,
		onClickEdit,
		guardVersionSwitch,
	};

	function getItemEndpoint() {
		if (isNew.value || collectionInfo.value?.meta?.singleton) {
			return getEndpoint(collection.value);
		}

		return `${getEndpoint(collection.value)}/${encodeURIComponent(primaryKey.value as string)}`;
	}

	function getContentRoute() {
		if (isNew.value || collectionInfo.value?.meta?.singleton) {
			return getCollectionRoute(collection.value);
		}

		return getItemRoute(collection.value, primaryKey.value, version?.key);
	}

	async function savePendingEdits() {
		saving.value = true;

		try {
			while (Object.keys(edits.value).length > 0) {
				const snapshot = cloneDeep(edits.value);
				const saved = await save(snapshot);

				if (!saved) return;

				removeSavedEdits(snapshot);
			}
		} finally {
			saving.value = false;
		}
	}

	async function save(editsSnapshot: Record<string, any>) {
		try {
			let response;
			let shouldReplaceEdits = true;
			let savedPayload = cloneDeep(editsSnapshot);

			if (isNew.value) {
				response = await api.post(itemEndpoint.value, editsSnapshot);
				notify({ title: t('item_create_success', 1), icon: 'check' });
			} else {
				const effectiveParentScope = getEffectiveParentScope();

				const target = await resolveWriteTarget({
					schema: getSchemaOverview({
						collections: collectionsStore.collections,
						relations: relationsStore.relations,
						getPrimaryKeyFieldForCollection: fieldsStore.getPrimaryKeyFieldForCollection,
					}),
					target: { collection: collection.value, key: primaryKey.value },
					hint: {
						explicitVersion: version?.key,
						page:
							version?.key && effectiveParentScope
								? { collection: effectiveParentScope.collection, item: effectiveParentScope.key, version: version.key }
								: null,
					},
					collectionHasVersioning: (collection) =>
						Boolean(collectionsStore.getCollection(collection)?.meta?.versioning),
					readParent,
				});

				if (target.kind === 'refuse') {
					notify({ title: getWriteTargetRefusalMessage(target.token), type: 'error' });
					return false;
				}

				if (target.kind === 'published') {
					response = await api.patch(itemEndpoint.value, editsSnapshot);
					notify({ title: t('item_update_success', 1), icon: 'check' });
				} else if (target.kind === 'item-version') {
					const versionId = await ensureVersionId(api, {
						collection: target.collection,
						item: target.key,
						versionKey: target.versionKey,
					});

					await api.post(`/versions/${versionId}/save`, buildPayload(target, editsSnapshot, primaryKey.value));

					response = await api.get(itemEndpoint.value, {
						params: {
							fields: Object.keys(editsSnapshot),
							version: target.versionKey,
						},
					});
				} else {
					const versionId = await ensureVersionId(api, {
						collection: target.parent.collection,
						item: target.parent.key,
						versionKey: target.parent.versionKey,
					});

					await api.post(`/versions/${versionId}/save`, buildPayload(target, editsSnapshot, primaryKey.value));
					shouldReplaceEdits = false;
				}
			}

			if (shouldReplaceEdits && response) {
				savedPayload = Object.fromEntries(Object.keys(editsSnapshot).map((key) => [key, response.data.data[key]]));
			}

			sendSaved({
				key: msgKey.value,
				collection: collection.value,
				item: primaryKey.value,
				payload: JSON.parse(JSON.stringify(savedPayload)),
			});

			emit('saved', { collection: collection.value, primaryKey: primaryKey.value });

			return true;
		} catch (error) {
			unexpectedError(error);
			return false;
		}
	}

	function removeSavedEdits(savedSnapshot: Record<string, any>) {
		const nextEdits = { ...edits.value };

		for (const [key, value] of Object.entries(savedSnapshot)) {
			if (isEqual(nextEdits[key], value)) {
				delete nextEdits[key];
			}
		}

		edits.value = nextEdits;
	}

	function setEditConfigData(data: unknown, createNew = false) {
		const { key, editConfig, rect } = data as { key: string; editConfig: EditConfig; rect: DOMRect };

		if (!key || !editConfig?.collection || !editConfig.item || (!createNew && editConfig.item === '+')) {
			notificationsStore.add({
				title: t(`errors.ITEM_NOT_FOUND`),
				text: `${t('collection')}: ${JSON.stringify(editConfig.collection)}, ${t('primary_key')}: ${JSON.stringify(
					editConfig.item,
				)}`,
				type: 'error',
				dialog: true,
			});

			resetEditConfigData();
			return false;
		}

		msgKey.value = key;
		collection.value = editConfig.collection;
		primaryKey.value = editConfig.item;
		fields.value = editConfig.fields ?? [];
		mode.value = availableModes.includes(editConfig.mode) ? editConfig.mode : 'drawer';

		position.value = {
			top: rect.top ?? 0,
			left: rect.left ?? 0,
			width: rect.width ?? 0,
			height: rect.height ?? 0,
		};

		return true;
	}

	function resetEditConfigData() {
		collection.value = '';
		primaryKey.value = '';
		fields.value = [];
		mode.value = 'drawer';
		initialValues.value = null;
		position.value = { top: 0, left: 0, width: 0, height: 0 };
	}

	async function onClickEdit(data: unknown) {
		const { editConfig } = data as EditData;
		const effectiveParentScope = parentScope ?? null;

		if (editConfig?.collection && (await guardVersionSwitch(editConfig.collection, effectiveParentScope)) === false) {
			return;
		}

		const success = setEditConfigData(data);
		if (!success) return;

		try {
			initialValues.value = await fetchParentVersionInitialValues();
		} catch (error) {
			resetEditConfigData();
			unexpectedError(error);
			return;
		}

		await nextTick();

		// `setFocusTemporarily()` makes sure that after clicking an edit button inside the iframe, the :focus moves to the Studio module, so the shortcuts work as expected.
		setFocusTemporarily();

		editOverlayActive.value = true;
	}

	function getWriteTargetRefusalMessage(token: WriteTargetRefusalToken) {
		return t(writeTargetRefusalMessageKeys[token]);
	}

	async function fetchParentVersionInitialValues() {
		const effectiveParentScope = getEffectiveParentScope();

		if (!version?.key || !effectiveParentScope || isNew.value) return null;
		if (collectionsStore.getCollection(collection.value)?.meta?.versioning) return null;
		if (!collectionsStore.getCollection(effectiveParentScope.collection)?.meta?.versioning) return null;

		const target = await resolveWriteTarget({
			schema: getSchemaOverview({
				collections: collectionsStore.collections,
				relations: relationsStore.relations,
				getPrimaryKeyFieldForCollection: fieldsStore.getPrimaryKeyFieldForCollection,
			}),
			target: { collection: collection.value, key: primaryKey.value },
			hint: {
				explicitVersion: version.key,
				page: { collection: effectiveParentScope.collection, item: effectiveParentScope.key, version: version.key },
			},
			collectionHasVersioning: (collection) => Boolean(collectionsStore.getCollection(collection)?.meta?.versioning),
			readParent,
		});

		if (target.kind !== 'parent-version') return null;

		const parentItem = await readParent(target.parent, getParentInitialValueFields(target.relation));
		if (!parentItem) return null;

		return findParentInitialValue(target.relation, parentItem, collection.value, primaryKey.value);
	}

	async function guardVersionSwitch(
		targetCollection: string,
		effectiveParentScope: VersionGateParentScope | null = null,
	): Promise<string | false> {
		const decision = versionGate.check(targetCollection, effectiveParentScope);
		if (decision.allowed) return version?.key ?? '';
		if (!switchVersion) return false;

		const outcome = await versionGate.requestSwitch(decision);
		if (outcome !== 'switched') return false;

		await nextTick();
		return decision.redirect.versionKey;
	}

	function getEffectiveParentScope() {
		return parentScope ?? null;
	}

	async function readParent(ref: { collection: string; key: PrimaryKey; versionKey: string }, fields: string[]) {
		// Materialize the version row before reading. `GET /items/:c/:k?version=X` returns 403
		// when no directus_versions row exists for that (collection, item, key). Phase 2 will
		// teach the API to fall back to published; this call can be removed then.
		await ensureVersionId(api, {
			collection: ref.collection,
			item: ref.key,
			versionKey: ref.versionKey,
		});

		const {
			data: { data },
		} = await api.get<{ data: Item }>(`${getEndpoint(ref.collection)}/${encodeURIComponent(String(ref.key))}`, {
			params: {
				fields,
				version: ref.versionKey,
			},
		});

		return data;
	}

	async function setFocusTemporarily() {
		if (!editingLayerEl.value) return;

		editingLayerEl.value.setAttribute('tabindex', '0');
		editingLayerEl.value.focus();

		await nextTick();
		editingLayerEl.value.removeAttribute('tabindex');
	}
}
</script>

<template>
	<div ref="editing-layer" class="editing-layer" :class="{ editing: editOverlayActive }">
		<OverlayItem
			v-if="collection"
			v-model:active="editOverlayActive"
			:overlay="mode"
			:collection
			:primary-key
			:selected-fields="fields"
			:edits="edits"
			:initial-item="initialValues"
			:version="version?.key"
			:popover-props="({ popoverWidth }) => (position.width > popoverWidth ? { arrowPlacement: 'start' } : {})"
			apply-shortcut="meta+s"
			prevent-cancel-with-edits
			@input="(value: any) => (edits = value)"
		>
			<template #popover-activator>
				<div
					class="popover-rect"
					:style="{
						inlineSize: `${position.width}px`,
						blockSize: `${position.height}px`,
						transform: `translate(${position.left}px,${position.top}px)`,
					}"
				></div>
			</template>

			<template #actions>
				<template v-if="primaryKey">
					<VButton
						v-if="mode === 'modal' || mode === 'popover'"
						:to="itemRoute"
						:disabled="isNew"
						:x-small="mode === 'popover'"
						secondary
					>
						{{ t('navigate_to_item') }}
					</VButton>

					<PrivateViewHeaderBarActionButton
						v-else
						v-tooltip.bottom="t('navigate_to_item')"
						:to="itemRoute"
						:disabled="isNew"
						icon="launch"
						variant="ghost"
					/>
				</template>
			</template>
		</OverlayItem>
	</div>
</template>

<style scoped lang="scss">
.editing-layer {
	position: absolute;
	inset: 0;
	pointer-events: none;
	overflow: hidden;

	&.editing {
		pointer-events: all;
	}

	.popover-rect {
		pointer-events: none;
		position: absolute;
		inset-block-start: 0;
		inset-inline-start: 0;
	}
}
</style>
