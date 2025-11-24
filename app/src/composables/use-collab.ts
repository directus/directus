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
	WebSocketCollabMessage,
} from '@directus/types';
import { capitalize, debounce, isEqual, throttle } from 'lodash';
import { computed, onBeforeUnmount, onMounted, ref, Ref, watch } from 'vue';

type InitMessage = Extract<ClientCollabMessage, { action: 'init' }>;
type JoinMessage = Extract<ClientCollabMessage, { action: 'join' }>;
type LeaveMessage = Extract<ClientCollabMessage, { action: 'leave' }>;
type UpdateMessage = Extract<ClientCollabMessage, { action: 'update' }>;
type FocusMessage = Extract<ClientCollabMessage, { action: 'focus' }>;

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
	const focused = ref<Record<ClientID, string>>({});
	const eventHandlers: RemoveEventHandler[] = [];

	const messageReceivers = {
		receiveJoin,
		receiveFocus,
		receiveInit,
		receiveLeave,
		receiveSave,
		receiveUpdate,
	};

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

	watch(version, (newVersion, oldVersion) => {
		if (newVersion?.key !== oldVersion?.key) {
			leave();
			join();
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
		if (roomId.value || !collection.value || item.value === '+') return;

		sdk.sendMessage({
			type: COLLAB,
			action: 'join',
			collection: collection.value,
			item: item.value ? String(item.value) : null,
			version: version.value?.key ?? null,
			initialChanges: edits.value,
		});
	}

	function leave() {
		sendMessage({
			action: 'leave',
		});

		roomId.value = null;
		connectionId.value = null;
	}

	eventHandlers.push(
		sdk.onWebSocket('message', async (message: ClientCollabMessage) => {
			if (
				message.action === 'init' &&
				message.collection === collection.value &&
				((!item.value && !message.item) || message.item === String(item.value)) &&
				((!version.value && !message.version) || message.version === version.value?.key)
			) {
				receiveInit(message);
				return;
			}

			if (!roomId.value || roomId.value !== message.room) return;

			messageReceivers[`receive${capitalize(message.action)}`](message as any);
		}),
	);

	const collabContext = {
		registerField(field: string) {
			const focusedBy = computed(() => {
				const focusedBy = Object.entries(focused.value).find(([cid, f]) => cid !== connectionId.value && f === field);
				if (!focusedBy) return;
				return users.value.find((user) => user.connection === focusedBy[0]);
			});

			return {
				onFieldUpdate: (value: unknown) => onFieldUpdate(field, value),
				onFieldUnset: () => onFieldUnset(field),
				onBlur: () => onFocus(null),
				focusedBy,
				onFocus: () => onFocus(field),
			};
		},
	};

	async function receiveInit(message: InitMessage) {
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

		focused.value = message.focuses;
	}

	function receiveUpdate(message: UpdateMessage) {
		if ('changes' in message) {
			if (!isEqual(message.changes, edits.value[message.field])) edits.value[message.field] = message.changes;
		} else {
			delete edits.value[message.field];
		}
	}

	async function receiveJoin(message: JoinMessage) {
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

		users.value = [...users.value, { ...user, id: message.user, color: message.color, connection: message.connection }];
	}

	async function receiveLeave(message: LeaveMessage) {
		users.value = users.value.filter((user) => user.connection !== message.connection);

		delete focused.value[message.connection];
	}

	async function receiveSave() {
		await getItem();

		if (!initialValues.value) return;

		for (const field of Object.keys(initialValues.value)) {
			if (isEqual(initialValues.value[field], edits.value[field])) delete edits.value[field];
		}
	}

	async function receiveFocus(message: FocusMessage) {
		if (connectionId.value === message.connection) return;

		if (message.field) {
			focused.value[message.connection] = message.field;
		} else {
			delete focused.value[message.connection];
		}
	}

	const onFieldUpdate = throttle((field: string, value: any) => {
		sendMessage({
			action: 'update',
			changes: value,
			field: field,
		});
	}, 100);

	const onFieldUnset = throttle((field: string) => {
		sendMessage({
			action: 'update',
			field: field,
		});
	}, 100);

	function onSave() {
		sendMessage({
			action: 'save',
		});
	}

	const onFocus = debounce((field: string | null) => {
		sendMessage({
			action: 'focus',
			field: field,
		});
	}, 100);

	function sendMessage(message: Omit<WebSocketCollabMessage, 'id'>) {
		if (!roomId.value) return;

		sdk.sendMessage({
			type: COLLAB,
			room: roomId.value,
			...message,
		});
	}

	return { onSave, users, collabContext, connected };
}
