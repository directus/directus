import sdk from '@/sdk';
import { readUser, readUsers, RemoveEventHandler } from '@directus/sdk';
import {
	Avatar,
	ClientCollabMessage,
	ClientID,
	COLLAB,
	CollabColor,
	ContentVersion,
	Item,
	PrimaryKey,
} from '@directus/types';
import { isEqual } from 'lodash';
import { computed, onBeforeUnmount, onMounted, ref, Ref, watch } from 'vue';

export type CollabUser = {
	id: string;
	first_name?: string;
	last_name?: string;
	connection: ClientID;
	color: CollabColor;
	avatar?: Avatar;
};

export type CollabFieldContext = {
	onFieldUpdate: (value: unknown) => void;
	onFieldUnset: () => void;
	onFocus: () => void;
	onBlur: () => void;
	focusedBy: Ref<CollabUser | undefined>;
};

export type CollabContext = {
	registerField: (field: string) => CollabFieldContext;
};

export function useCollab(
	collection: Ref<string>,
	item: Ref<PrimaryKey | null>,
	version: Ref<ContentVersion | null>,
	initialValues: Ref<Item | null>,
	edits: Ref<Item>,
	getItem: () => Promise<void>,
	active?: Ref<boolean>,
): {
	onSave: () => void;
	users: Ref<CollabUser[]>;
	collabContext: CollabContext;
	connected: Ref<boolean>;
} {
	const connected = ref(false);

	const roomId = ref<string | null>(null);
	const connectionId = ref<ClientID | null>(null);
	const users = ref<CollabUser[]>([]);
	const focused = ref<Record<string, CollabUser>>({});
	const eventHandlers: RemoveEventHandler[] = [];

	onMounted(() => {
		if (active) return;
		join();
	});

	onBeforeUnmount(() => {
		eventHandlers.forEach((eventHandler) => eventHandler());

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

	eventHandlers.push(
		sdk.onWebSocket('open', () => {
			connected.value = true;
			join();
		}),
	);

	eventHandlers.push(
		sdk.onWebSocket('close', () => {
			connected.value = false;
			roomId.value = null;
			connectionId.value = null;
			users.value = [];
			focused.value = {};
		}),
	);

	function join() {
		if (roomId.value || !collection.value || !item.value || item.value === '+') return;

		sdk.sendMessage({
			type: COLLAB,
			action: 'join',
			collection: collection.value,
			item: String(item.value),
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

	eventHandlers.push(
		sdk.onWebSocket('message', async (message: ClientCollabMessage) => {
			if (
				message.action === 'init' &&
				message.collection === collection.value &&
				message.item === String(item.value) &&
				message.version === version.value
			) {
				roomId.value = message.room;
				connectionId.value = message.connection;

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

			if (!roomId.value || roomId.value !== message.room) return;

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
					: await sdk
							.request<CollabUser>(
								readUser(message.user, {
									fields: ['id', 'first_name', 'last_name', 'avatar.id', 'avatar.modified_on'],
								}),
							)
							.catch(() => ({}));

				users.value = [
					...users.value,
					{ ...user, id: message.user, color: message.color, connection: message.connection },
				];
			}

			if (message.action === 'leave') {
				users.value = users.value.filter((user) => user.connection !== message.connection);

				focused.value = Object.fromEntries(
					Object.entries(focused.value).filter(
						([_, user]) => user?.connection && user.connection !== message.connection,
					),
				);
			}

			if (message.action === 'save') {
				await getItem();

				if (!initialValues.value) return;

				for (const field of Object.keys(initialValues.value)) {
					if (isEqual(initialValues.value[field], edits.value[field])) delete edits.value[field];
				}
			}

			if (message.action === 'focus') {
				if (connectionId.value === message.connection) return;

				if (message.field) {
					const user = users.value.find((user) => user.connection === message.connection);

					if (user) focused.value = { ...focused.value, [message.field]: user };
				} else {
					focused.value = Object.fromEntries(
						Object.entries(focused.value).filter(([_, user]) => user.connection !== message.connection),
					);
				}
			}
		}),
	);

	const collabContext = {
		registerField(field: string) {
			const focusedBy = computed(() => {
				if (focused.value[field]?.connection === connectionId.value) return;
				return focused.value[field];
			});

			return {
				onFieldUpdate: (value: unknown) => onFieldUpdate(field, value),
				onFieldUnset: () => onFieldUnset(field),
				onBlur,
				focusedBy,
				onFocus: () => onFocus(field),
			};
		},
	};

	function onFieldUpdate(field: string, value: any) {
		console.log('onFieldUpdate', field, value);
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

	return { onSave, users, collabContext, connected };
}
