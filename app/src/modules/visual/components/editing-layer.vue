<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import { useEventListener } from '@vueuse/core';
import { useCollection } from '@directus/composables';
import { PrimaryKey } from '@directus/types';
import { getEndpoint } from '@directus/utils';
import api from '@/api';
import { useNotificationsStore } from '@/stores/notifications';
import { getItemRoute, getCollectionRoute } from '@/utils/get-route';
import { notify } from '@/utils/notify';
import { unexpectedError } from '@/utils/unexpected-error';

type Form = {
	collection: string;
	item: PrimaryKey | null;
	fields?: string[];
	mode: 'drawer';
};
type ReceiveAction = 'connect' | 'edit';
type ReceiveData = { action: ReceiveAction | null; data: unknown };
type SendAction = 'confirm' | 'saved';
type SavedData = {
	key: string;
	collection: Form['collection'];
	item: Form['item'];
	payload: Record<string, any>;
};

const { url, frameEl } = defineProps<{ url: string; frameEl?: HTMLIFrameElement }>();

const { t } = useI18n();

const { collection, primaryKey, fields, isNew, edits, editOverlayActive, itemRoute, onClickEdit } = useItem();

const { sendSaved } = useWebsiteFrame({ onClickEdit });

function useWebsiteFrame({ onClickEdit }: { onClickEdit: (data: unknown) => void }) {
	useEventListener('message', (event) => {
		if (!sameOrigin(event.origin, url)) return;

		const { action = null, data = null }: ReceiveData = event.data;

		if (action === 'connect') sendConfirm();
		if (action === 'edit') onClickEdit(data);
	});

	return { sendSaved };

	function send(action: SendAction, data: unknown) {
		frameEl?.contentWindow?.postMessage({ action, data }, url);
	}

	function sendConfirm() {
		send('confirm', null);
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

function useItem() {
	const edits = ref<Record<string, any>>({});
	const editOverlayActive = ref(false);
	const msgKey = ref('');
	const collection = ref<Form['collection']>('');
	const primaryKey = ref<PrimaryKey>('');
	const fields = ref<Form['fields']>([]);
	const mode = ref<Form['mode']>('drawer');
	const isNew = computed(() => primaryKey.value === '+');
	const itemEndpoint = computed(getItemEndpoint);
	const itemRoute = computed(getContentRoute);
	const store = useNotificationsStore();
	const { info: collectionInfo } = useCollection(collection);

	watch(edits, (newEdits) => {
		const hasEdits = Object.keys(newEdits)?.length;
		if (!hasEdits) return;
		save();
	});

	return {
		collection,
		primaryKey,
		fields,
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

	function setFormData(data: unknown, createNew = false) {
		const { key, form } = data as { key: string; form: Form };

		if (!key || !form?.collection || !form.item || (!createNew && form.item === '+')) {
			store.add({
				title: t(`errors.ITEM_NOT_FOUND`),
				text: `${t('collection')}: ${JSON.stringify(form.collection)}, ${t('primary_key')}: ${JSON.stringify(
					form.item,
				)}`,
				type: 'error',
				dialog: true,
			});

			resetFormData();
			return;
		}

		msgKey.value = key;
		collection.value = form.collection;
		primaryKey.value = form.item;
		fields.value = form.fields ?? [];
	}

	function resetFormData() {
		collection.value = '';
		primaryKey.value = '';
		fields.value = [];
		mode.value = 'drawer';
	}

	async function onClickEdit(data: unknown) {
		setFormData(data, true);
		await nextTick();
		editOverlayActive.value = true;
	}
}
</script>

<template>
	<div class="editing-layer">
		<drawer-item
			v-if="collection"
			v-model:active="editOverlayActive"
			:collection
			:primary-key
			:selected-fields="fields"
			:edits="edits"
			@input="(value: any) => (edits = value)"
		>
			<template #actions>
				<v-button
					v-if="primaryKey"
					v-tooltip.bottom="t('navigate_to_item')"
					:to="itemRoute"
					:disabled="isNew"
					secondary
					icon
					rounded
				>
					<v-icon name="launch" />
				</v-button>
			</template>
		</drawer-item>
	</div>
</template>

<style scoped lang="scss">
.editing-layer {
	position: absolute;
	inset: 0;
	pointer-events: none;
	overflow: hidden;
}
</style>
