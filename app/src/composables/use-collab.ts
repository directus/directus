import sdk from '@/sdk';
import { useUserStore } from '@/stores/user';
import { ClientCollabMessage, COLLAB, ContentVersion, Item, PrimaryKey } from '@directus/types';
import { isEqual } from 'lodash';
import { computed, provide, ref, Ref } from 'vue';

export function useCollab(
	collection: Ref<string>,
	primaryKey: Ref<PrimaryKey | null>,
	version: Ref<ContentVersion | null>,
	edits: Ref<Item>,
	refresh: () => void,
) {
	sdk.connect();
	const userStore = useUserStore();

	const roomId = ref<string | null>(null);
	const focused = ref<Record<string, any>>({});

	sdk.onWebSocket('open', () => {
		sdk.sendMessage({
			type: COLLAB,
			action: 'join',
			collection: collection.value,
			item: primaryKey.value,
			version: version.value,
			initialChanges: edits.value,
		});

		sdk.onWebSocket('message', (message: ClientCollabMessage) => {
			if (message.action === 'init') {
				roomId.value = message.room;

				if (!isEqual(message.changes, edits.value)) edits.value = message.changes;
			}

			if (message.action === 'update') {
				if ('changes' in message) {
					if (!isEqual(message.changes, edits.value[message.field]))
						edits.value = { ...edits.value, [message.field]: message.changes };
				} else {
					delete edits.value[message.field];
				}
			}

			if (message.action === 'save') {
				edits.value = {};
				refresh();
			}

			if (message.action === 'focus') {
				if (userStore.currentUser && 'id' in userStore.currentUser && message.user === userStore.currentUser.id) return;

				if (message.field) {
					focused.value = { ...focused.value, [message.field]: message.user };
				} else {
					focused.value = Object.fromEntries(
						Object.entries(focused.value).filter(([_, user]) => user !== message.user),
					);
				}
			}
		});
	});

	provide(COLLAB, (field: string) => {
		const focusedBy = computed<string | undefined>(() => {
			return focused.value[field];
		});

		return {
			onFieldUpdate: (value: unknown) => onFieldUpdate(field, value),
			onFieldUnset: () => onFieldUnset(field),
			onBlur,
			focusedBy,
			onFocus: () => onFocus(field),
		};
	});

	function onFieldUpdate(field: string, value: any) {
		if (!roomId.value) return;

		sdk.sendMessage({
			type: COLLAB,
			action: 'update',
			changes: value,
			field: field,
			room: roomId.value,
		});
	}

	function onFieldUnset(field: string) {
		if (!roomId.value) return;

		sdk.sendMessage({
			type: COLLAB,
			action: 'update',
			field: field,
			room: roomId.value,
		});
	}

	function onSave() {
		sdk.sendMessage({
			type: COLLAB,
			action: 'save',
			room: roomId.value,
		});
	}

	function onFocus(field: string) {
		sdk.sendMessage({
			type: COLLAB,
			action: 'focus',
			field,
			room: roomId.value,
		});
	}

	function onBlur() {
		sdk.sendMessage({
			type: COLLAB,
			action: 'focus',
			field: null,
			room: roomId.value,
		});
	}

	return { onSave };
}
