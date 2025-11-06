import sdk from '@/sdk';
import { readUser, readUsers } from '@directus/sdk';
import {
	Avatar,
	ClientCollabMessage,
	ClientID,
	COLLAB,
	CollabColor,
	ContentVersion,
	Item,
	PrimaryKey,
	User,
} from '@directus/types';
import { isEqual } from 'lodash';
import { computed, onBeforeUnmount, onMounted, provide, ref, Ref, watch } from 'vue';

export type CollabUser = Pick<User, 'id' | 'first_name' | 'last_name'> & {
	connection: ClientID;
	color: CollabColor;
	avatar?: Avatar;
};

export function useCollab(
	collection: Ref<string>,
	primaryKey: Ref<PrimaryKey | null>,
	version: Ref<ContentVersion | null>,
	edits: Ref<Item>,
	refresh: () => void,
	active?: Ref<boolean>,
) {
	const connected = ref(false);

	const roomId = ref<string | null>(null);
	const connectionId = ref<ClientID | null>(null);
	const users = ref<CollabUser[]>([]);
	const focused = ref<Record<string, CollabUser>>({});

	onMounted(() => {
		if (active) return;
		join();
	});

	onBeforeUnmount(() => {
		if (active) return;
		leave();
	});

	watch([active], () => {
		if (active?.value) {
			join();
		} else {
			leave();
		}
	});

	sdk.onWebSocket('open', () => {
		connected.value = true;
		join();
	});

	sdk.onWebSocket('close', () => {
		connected.value = false;
		roomId.value = null;
		connectionId.value = null;
		users.value = [];
		focused.value = {};
	});

	function join() {
		if (roomId.value || !collection.value || !primaryKey.value || primaryKey.value === '+') return;

		console.log('join', collection.value, primaryKey.value, version.value);

		sdk.sendMessage({
			type: COLLAB,
			action: 'join',
			collection: collection.value,
			item: primaryKey.value,
			version: version.value,
			initialChanges: edits.value,
		});
	}

	function leave() {
		sdk.sendMessage({
			type: COLLAB,
			action: 'leave',
			room: roomId.value,
		});

		roomId.value = null;
		connectionId.value = null;
	}

	sdk.onWebSocket('message', async (message: ClientCollabMessage) => {
		if (roomId.value && roomId.value !== message.room) return;

		if (message.action === 'init') {
			roomId.value = message.room;
			connectionId.value = message.connection;

			console.log('joined', message.room);

			if (!isEqual(message.changes, edits.value)) edits.value = message.changes;

			if (message.users.length === 0) return;

			const usersInfo = await sdk.request(
				readUsers({
					filter: {
						id: {
							_in: Array.from(new Set(message.users.map((user) => user.user))),
						},
					},
					fields: ['id', 'first_name', 'last_name', 'avatar.id', 'avatar.modified_on'],
				}),
			);

			users.value = message.users
				.map(({ user, color, connection }) => {
					const info = usersInfo.find((u) => u.id === user) as any;

					return {
						...info,
						color,
						connection,
					};
				})
				.sort((a, b) => {
					if (a.connection === message.connection) return -1;
					if (b.connection === message.connection) return 1;
					return 0;
				});

			focused.value = Object.fromEntries(
				Object.entries(message.focuses).map(([field, user]) => {
					return [field, users.value.find((u) => u.id === user)!];
				}),
			);
		}

		if (message.action === 'update') {
			if ('changes' in message) {
				if (!isEqual(message.changes, edits.value[message.field]))
					edits.value = { ...edits.value, [message.field]: message.changes };
			} else {
				delete edits.value[message.field];
			}
		}

		if (message.action === 'join') {
			const existingInfo = users.value.find((user) => user.id === message.user);

			const user = existingInfo
				? existingInfo
				: await sdk.request<CollabUser>(
						readUser(message.user, { fields: ['id', 'first_name', 'last_name', 'avatar.id', 'avatar.modified_on'] }),
					);

			users.value = [...users.value, { ...user, color: message.color, connection: message.connection }];
		}

		if (message.action === 'leave') {
			users.value = users.value.filter((user) => user.connection !== message.connection);

			focused.value = Object.fromEntries(
				Object.entries(focused.value).filter(([_, user]) => user.connection !== message.connection),
			);
		}

		if (message.action === 'save') {
			edits.value = {};
			refresh();
		}

		if (message.action === 'focus') {
			if (connectionId.value === message.connection) return;

			if (message.field) {
				const user = users.value.find((user) => user.connection === message.connection)!;

				focused.value = { ...focused.value, [message.field]: user };
			} else {
				focused.value = Object.fromEntries(
					Object.entries(focused.value).filter(([_, user]) => user.connection !== message.connection),
				);
			}
		}
	});

	provide(COLLAB, (field: string) => {
		const focusedBy = computed(() => {
			return focused.value[field];
		});

		const style = computed(() => {
			if (!focusedBy.value) return {};
			return {
				'box-shadow': `0 0 16px -8px var(--${focusedBy.value?.color})`,
				'--theme--form--field--input--border-color': `var(--${focusedBy.value?.color})`,
			};
		});

		return {
			onFieldUpdate: (value: unknown) => onFieldUpdate(field, value),
			onFieldUnset: () => onFieldUnset(field),
			onBlur,
			style,
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

	return { onSave, users, connected };
}
