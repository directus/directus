<script setup lang="ts">
import { useCollection } from '@directus/composables';
import type { ContentVersion, PrimaryKey } from '@directus/types';
import { getEndpoint } from '@directus/utils';
import { useEventListener } from '@vueuse/core';
import { computed, nextTick, onUnmounted, ref, toRaw, useTemplateRef, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import type {
	AddToContextData,
	EditConfig,
	HighlightElementData,
	NavigationData,
	ReceiveData,
	SavedData,
	SendAction,
} from '../types';
import { sameOrigin } from '../utils/same-origin';
import { useContextStaging } from '@/ai/composables/use-context-staging';
import { useAiStore } from '@/ai/stores/use-ai';
import { useAiContextStore } from '@/ai/stores/use-ai-context';
import { useAiToolsStore } from '@/ai/stores/use-ai-tools';
import api from '@/api';
import VButton from '@/components/v-button.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import { useNotificationsStore } from '@/stores/notifications';
import { useServerStore } from '@/stores/server';
import { useSettingsStore } from '@/stores/settings';
import { getCollectionRoute, getItemRoute } from '@/utils/get-route';
import { notify } from '@/utils/notify';
import { unexpectedError } from '@/utils/unexpected-error';
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
}>();

const { t } = useI18n();

const { collection, primaryKey, fields, mode, position, isNew, edits, editOverlayActive, itemRoute, onClickEdit } =
	useItemWithEdits();

const tooltipPlacement = computed(() => (mode.value === 'drawer' ? 'bottom' : null));

const { sendSaved, sendHighlightElement } = useWebsiteFrame({ onClickEdit });

useVisualEditingAi({ sendSaved, sendHighlightElement });

const { popoverWidth } = usePopoverWidth();

// Clear highlight when edit overlay closes
watch(editOverlayActive, (isActive) => {
	if (!isActive) {
		sendHighlightElement({ key: null });
	}
});

function useWebsiteFrame({ onClickEdit }: { onClickEdit: (data: unknown) => void }) {
	const serverStore = useServerStore();
	const settingsStore = useSettingsStore();
	const contextStore = useAiContextStore();
	const { stageVisualElement } = useContextStaging();

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

	function send(action: SendAction, data: unknown) {
		frameEl?.contentWindow?.postMessage({ action, data }, frameSrc);
	}

	function sendConfirm() {
		const aiEnabled = serverStore.info.ai_enabled && settingsStore.availableAiProviders.length > 0;
		send('confirm', { aiEnabled });
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
	const editOverlayActive = ref(false);
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

	watch(edits, (newEdits) => {
		const hasEdits = Object.keys(newEdits)?.length;
		if (!hasEdits) return;
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

		return getItemRoute(collection.value, primaryKey.value);
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

function usePopoverWidth() {
	/**
	 * Hardcode this value, since its parts probably won't change. However, keep it in sync with the `width` of `.popover-item-content` in app/src/views/private/components/overlay-item.vue
	 *
	 * Parts:
	 * const formColumnWidth = 300; // app/src/styles/_variables.scss
	 * const popoverColumnGap = 16;
	 * const popoverPadding = 16 * 2;
	 * const popoverWidth = 2 * formColumnWidth + popoverColumnGap + popoverPadding;
	 */

	return { popoverWidth: 648 };
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
			:popover-props="position.width > popoverWidth ? { arrowPlacement: 'start' } : {}"
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
					<VButton v-if="mode === 'modal'" secondary :to="itemRoute" :disabled="isNew">
						{{ t('navigate_to_item') }}
					</VButton>

					<VButton
						v-else
						v-tooltip:[tooltipPlacement]="t('navigate_to_item')"
						:to="itemRoute"
						:disabled="isNew"
						:x-small="mode === 'popover'"
						:small="mode !== 'popover'"
						secondary
						icon
						rounded
					>
						<VIcon name="launch" small />
					</VButton>
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
