<script setup lang="ts">
import { useCollection } from '@directus/composables';
import { VERSION_KEY_DRAFT } from '@directus/constants';
import type { ContentVersion, PrimaryKey } from '@directus/types';
import { getEndpoint } from '@directus/utils';
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
import { computed, nextTick, onUnmounted, ref, toRaw, useTemplateRef, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import type { NavigationData, ReceiveData } from '../types';
import { useContextStaging } from '@/ai/composables/use-context-staging';
import { useAiStore } from '@/ai/stores/use-ai';
import { useAiContextStore } from '@/ai/stores/use-ai-context';
import { useAiToolsStore } from '@/ai/stores/use-ai-tools';
import api from '@/api';
import VButton from '@/components/v-button.vue';
import { useCollectionPermissions } from '@/composables/use-permissions';
import { useCollectionsStore } from '@/stores/collections';
import { useNotificationsStore } from '@/stores/notifications';
import { usePermissionsStore } from '@/stores/permissions';
import { useServerStore } from '@/stores/server';
import { useSettingsStore } from '@/stores/settings';
import { useUserStore } from '@/stores/user';
import { getCollectionRoute, getItemRoute } from '@/utils/get-route';
import { notify } from '@/utils/notify';
import { unexpectedError } from '@/utils/unexpected-error';
import { PrivateViewHeaderBarActionButton } from '@/views/private';
import OverlayItem from '@/views/private/components/overlay-item.vue';

const { frameSrc, frameEl, showEditableElements, version } = defineProps<{
	frameSrc: string;
	frameEl?: HTMLIFrameElement;
	showEditableElements?: boolean;
	version: Pick<ContentVersion, 'key' | 'name'> | null;
}>();

const emit = defineEmits<{
	navigation: [data: NavigationData];
	saved: [data: { collection: string; primaryKey: PrimaryKey }];
	switchVersion: [versionKey: ContentVersion['key'], onSwitched: () => void];
}>();

const { t } = useI18n();

const {
	collection,
	primaryKey,
	fields,
	mode,
	position,
	isNew,
	edits,
	editOverlayActive,
	itemRoute,
	hidePopoverArrow,
	onClickEdit,
} = useItemWithEdits();

const { sendSaved, sendHighlightElement } = useWebsiteFrame({ onClickEdit });

useVisualEditingAi({ sendSaved, sendHighlightElement });

// Clear highlight when edit overlay closes
watch(editOverlayActive, (isActive) => {
	if (!isActive) {
		sendHighlightElement({ key: null });
	}
});

function useWebsiteFrame({ onClickEdit }: { onClickEdit: (data: unknown) => void }) {
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

		if (action === 'addToContext') receiveAddToContext(data);
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

		if (version && !collectionInfo.meta?.versioning) return false;

		if (userStore.isAdmin) return true;

		const permission = permissionsStore.getPermission(collection, 'update');
		if (!permission || permission.access === 'none') return false;

		if (fields.length && permission.fields && !permission.fields.includes('*')) {
			if (!fields.some((field) => permission.fields!.includes(field))) return false;
		}

		return true;
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

	function receiveAddToContext(data: unknown) {
		const { key, editConfig, rect } = data as AddToContextData;

		if (!key || !editConfig?.collection || editConfig.item == null) return;

		stageVisualElement({
			key,
			collection: editConfig.collection,
			item: editConfig.item,
			fields: editConfig.fields,
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

	// Any non-read mutation should trigger a preview refresh
	const unsubscribeItemsResult = toolsStore.onSystemToolResult((tool, input) => {
		if (tool !== 'items') return;
		if (input.action === 'read') return;

		sendSaved({ key: '', collection: input.collection as string, item: null, payload: {} });
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
		unsubscribeItemsResult.off();
		unsubscribeHighlight.off();
		contextStore.clearVisualElementContext();
	});
}

function useItemWithEdits() {
	const edits = ref<Record<string, any>>({});
	const saving = ref(false);
	const editOverlayActive = ref(false);
	const hidePopoverArrow = ref(false);
	const msgKey = ref('');
	const collection = ref<EditConfig['collection']>('');
	const primaryKey = ref<PrimaryKey>('');
	const fields = ref<EditConfig['fields']>([]);
	const availableModes: EditConfig['mode'][] = ['drawer', 'modal', 'popover'];
	const mode = ref<EditConfig['mode']>('drawer');
	const position = ref<Pick<DOMRect, 'top' | 'left' | 'width' | 'height'>>({ top: 0, left: 0, width: 0, height: 0 });
	const isNew = computed(() => primaryKey.value === '+');
	const itemEndpoint = computed(getItemEndpoint);
	const itemRoute = computed(getContentRoute);
	const notificationsStore = useNotificationsStore();
	const { info: collectionInfo } = useCollection(collection);

	const editingLayerEl = useTemplateRef<HTMLElement>('editing-layer');

	watch([edits, saving], ([newEdits, isSaving]) => {
		const hasEdits = Object.keys(newEdits)?.length;
		if (!hasEdits || isSaving) return;

		save();
	});

	return {
		collection,
		primaryKey,
		fields,
		mode,
		position,
		isNew,
		edits,
		editOverlayActive,
		itemRoute,
		hidePopoverArrow,
		onClickEdit,
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

	function resetEdits() {
		edits.value = {};
	}

	async function fetchOrCreateVersionId(versionKey: ContentVersion['key']) {
		const {
			data: { data: existing },
		} = await api.get('/versions', {
			params: {
				filter: {
					collection: { _eq: collection.value },
					item: { _eq: String(primaryKey.value) },
					key: { _eq: versionKey },
				},
				limit: 1,
				fields: ['id'],
			},
		});

		if (existing.length) return existing[0].id;

		const {
			data: { data: created },
		} = await api.post('/versions', {
			key: versionKey,
			collection: collection.value,
			item: String(primaryKey.value),
		});

		return created.id;
	}

	async function save() {
		saving.value = true;

		try {
			let response;

			if (version) {
				const versionId: PrimaryKey = await fetchOrCreateVersionId(version.key);
				response = await api.post(`/versions/${versionId}/save`, edits.value);
			} else if (isNew.value) {
				response = await api.post(itemEndpoint.value, edits.value);
				notify({ title: t('item_create_success', 1), icon: 'check' });
			} else {
				response = await api.patch(itemEndpoint.value, edits.value);
				notify({ title: t('item_update_success', 1), icon: 'check' });
			}

			const replaceEditsWithResponseData = (key: string) => (edits.value[key] = response.data.data[key]);
			Object.keys(edits.value).forEach(replaceEditsWithResponseData);

			sendSaved({
				key: msgKey.value,
				collection: collection.value,
				item: primaryKey.value,
				payload: JSON.parse(JSON.stringify(edits.value)),
			});

			emit('saved', { collection: collection.value, primaryKey: primaryKey.value });

			resetEdits();
		} catch (error) {
			unexpectedError(error);
		} finally {
			saving.value = false;
		}
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
		position.value = { top: 0, left: 0, width: 0, height: 0 };
	}

	async function onClickEdit(data: unknown) {
		const success = setEditConfigData(data);
		if (!success) return;
		await nextTick();

		const switchToDraftVersion = version === null && !!collectionInfo.value?.meta?.versioning;
		hidePopoverArrow.value = switchToDraftVersion;

		if (switchToDraftVersion) {
			await new Promise<void>((resolve) => emit('switchVersion', VERSION_KEY_DRAFT, resolve));

			notificationsStore.add({
				title: t('editing_draft_version'),
				icon: 'edit',
			});
		}

		// `setFocusTemporarily()` makes sure that after clicking an edit button inside the iframe, the :focus moves to the Studio module, so the shortcuts work as expected.
		setFocusTemporarily();

		editOverlayActive.value = true;
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
			:version="version?.key"
			:popover-props="
				({ popoverWidth }) => ({
					...(position.width > popoverWidth ? { arrowPlacement: 'start' } : {}),
					showArrow: !hidePopoverArrow,
				})
			"
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
						:active="false"
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
