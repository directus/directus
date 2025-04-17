<script setup lang="ts">
import { ref, computed, watch, nextTick, useTemplateRef } from 'vue';
import { useI18n } from 'vue-i18n';
import { useEventListener } from '@vueuse/core';
import { useCollection } from '@directus/composables';
import { PrimaryKey } from '@directus/types';
import { getEndpoint } from '@directus/utils';
import api from '@/api';
import { useNotificationsStore } from '@/stores/notifications';
import OverlayItem from '@/views/private/components/overlay-item.vue';
import { getItemRoute, getCollectionRoute } from '@/utils/get-route';
import { notify } from '@/utils/notify';
import { unexpectedError } from '@/utils/unexpected-error';
import type { EditConfig, ReceiveData, SendAction, SavedData } from '../types';

const { url, frameEl, showEditableElements } = defineProps<{
	url: string;
	frameEl?: HTMLIFrameElement;
	showEditableElements?: boolean;
}>();

const { t } = useI18n();

const { collection, primaryKey, fields, mode, position, isNew, edits, editOverlayActive, itemRoute, onClickEdit } =
	useItemWithEdits();

const tooltipPlacement = computed(() => (mode.value === 'drawer' ? 'bottom' : null));

const { sendSaved } = useWebsiteFrame({ onClickEdit });

function useWebsiteFrame({ onClickEdit }: { onClickEdit: (data: unknown) => void }) {
	useEventListener('message', (event) => {
		if (!sameOrigin(event.origin, url)) return;

		const { action = null, data = null }: ReceiveData = event.data;

		if (action === 'connect') {
			sendConfirm();
			if (showEditableElements) sendShowEditableElements(true);
		}

		if (action === 'edit') onClickEdit(data);
	});

	watch(
		() => showEditableElements,
		(newValue, oldValue) => {
			if (newValue !== oldValue) sendShowEditableElements(newValue);
		},
	);

	return { sendSaved };

	function send(action: SendAction, data: unknown) {
		frameEl?.contentWindow?.postMessage({ action, data }, url);
	}

	function sendConfirm() {
		send('confirm', null);
	}

	function sendShowEditableElements(show: boolean) {
		send('showEditableElements', show);
	}

	function sendSaved(data: SavedData) {
		send('saved', data);
	}

	function sameOrigin(origin: string, url: string) {
		try {
			return origin === new URL(url).origin;
		} catch {
			return false;
		}
	}
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

	async function save() {
		try {
			let response;

			if (isNew.value) {
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
</script>

<template>
	<div
		ref="editing-layer"
		class="editing-layer"
		:class="{ editing: editOverlayActive }"
		@click="editOverlayActive = false"
	>
		<overlay-item
			v-if="collection"
			v-model:active="editOverlayActive"
			:overlay="mode"
			:collection
			:primary-key
			:selected-fields="fields"
			:edits="edits"
			shortcuts
			@input="(value: any) => (edits = value)"
		>
			<template #popover-activator>
				<div
					class="popover-rect"
					:style="{
						width: `${position.width}px`,
						height: `${position.height}px`,
						transform: `translate(${position.left}px,${position.top}px)`,
					}"
				></div>
			</template>

			<template #actions>
				<template v-if="primaryKey">
					<v-button v-if="mode === 'modal'" secondary :to="itemRoute" :disabled="isNew">
						{{ t('navigate_to_item') }}
					</v-button>

					<v-button
						v-else
						v-tooltip:[tooltipPlacement]="t('navigate_to_item')"
						:to="itemRoute"
						:disabled="isNew"
						:x-small="mode === 'popover'"
						secondary
						icon
						rounded
					>
						<v-icon name="launch" :small="mode === 'popover'" />
					</v-button>
				</template>
			</template>
		</overlay-item>
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
		top: 0;
		left: 0;
	}
}
</style>
