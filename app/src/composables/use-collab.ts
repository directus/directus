import { readUser, readUsers, RemoveEventHandler, WebSocketInterface } from '@directus/sdk';
import { Avatar, ContentVersion, Item, PrimaryKey, WS_TYPE } from '@directus/types';
import { ACTION, ClientID, ClientMessage, Color, ServerError, ServerMessage } from '@directus/types/collab';
import { capitalize, debounce, isEmpty, isEqual, throttle } from 'lodash';
import { computed, onBeforeUnmount, onMounted, ref, Ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import sdk from '@/sdk';
import { useNotificationsStore } from '@/stores/notifications';
import { useServerStore } from '@/stores/server';
import { useSettingsStore } from '@/stores/settings';
import { notify } from '@/utils/notify';

type InitMessage = Extract<ServerMessage, { action: typeof ACTION.SERVER.INIT }>;
type JoinMessage = Extract<ServerMessage, { action: typeof ACTION.SERVER.JOIN }>;
type LeaveMessage = Extract<ServerMessage, { action: typeof ACTION.SERVER.LEAVE }>;
type UpdateMessage = Extract<ServerMessage, { action: typeof ACTION.SERVER.UPDATE }>;
type FocusMessage = Extract<ServerMessage, { action: typeof ACTION.SERVER.FOCUS }>;

export type CollabUser = {
	id: string;
	first_name?: string;
	last_name?: string;
	connection: ClientID;
	color: Color;
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
	update: (changes: Item) => void;
	focusedFields: string[];
	registerField: (field: string) => CollabFieldContext;
};

let wsConnecting: Promise<WebSocketInterface> | false = false;

sdk.onWebSocket('message', async (message: ServerMessage | ServerError) => {
	if (message.action === ACTION.SERVER.ERROR) {
		// Ignore join messages to not show them when the item doens't exist
		if (message.trigger === 'join') return;

		notify({
			title: message.message,
			code: message.code,
			showReload: true,
		});

		return;
	}
});

export function useCollab(
	collection: Ref<string>,
	item: Ref<PrimaryKey | null>,
	version: Ref<ContentVersion | null>,
	initialValues: Ref<Item | null>,
	edits: Ref<Item>,
	getItem: () => Promise<void>,
	active?: Ref<boolean>,
): {
	update: (changes: Item) => void;
	clearCollidingChanges: () => void;
	users: Ref<CollabUser[]>;
	collabContext: CollabContext;
	connected: Ref<boolean | undefined>;
	collabCollision: Ref<{ from: Item; to: Item } | undefined>;
	discard: () => void;
} {
	const serverStore = useServerStore();
	const settingsStore = useSettingsStore();
	const notificationsStore = useNotificationsStore();
	const connected = ref<boolean | undefined>(undefined);
	const { t } = useI18n();

	const roomId = ref<string | null>(null);
	const connectionId = ref<ClientID | null>(null);
	const joining = ref(false);
	const users = ref<CollabUser[]>([]);
	const focused = ref<Record<ClientID, string>>({});
	const collidingLocalChanges = ref<Item | undefined>();
	const eventHandlers: RemoveEventHandler[] = [];
	let largestUpdateOrder = 0;
	const router = useRouter();

	const collabCollision = computed(() => {
		if (!collidingLocalChanges.value) return undefined;

		return {
			from: { ...initialValues.value, ...edits.value },
			to: { ...initialValues.value, ...edits.value, ...collidingLocalChanges.value },
		};
	});

	const messageReceivers = {
		receiveJoin,
		receiveFocus,
		receiveInit,
		receiveLeave,
		receiveSave,
		receiveUpdate,
		receiveDelete,
		receiveDiscard,
	};

	onMounted(async () => {
		if (serverStore.info?.websocket && serverStore.info.websocket.collab && settingsStore.settings?.collaboration) {
			try {
				if (wsConnecting === false) wsConnecting = sdk.connect();
				await wsConnecting;
				connected.value = true;
			} catch (e: any) {
				if (e.message?.toLowerCase().includes('open')) {
					connected.value = true;
				}
			} finally {
				wsConnecting = false;
			}
		}

		if (!active || active.value) join();
	});

	onBeforeUnmount(() => {
		eventHandlers.forEach((eventHandler) => eventHandler());

		if (!active) {
			leave();
		}
	});

	watch(
		() => active?.value,
		(isActive) => {
			if (isActive) {
				join();
			} else {
				leave();
			}
		},
	);

	watch(item, () => {
		leave();
		join();
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

	eventHandlers.push(sdk.onWebSocket('close', disconnect));

	function disconnect() {
		connected.value = false;
		joining.value = false;
		roomId.value = null;
		connectionId.value = null;
		users.value = [];
		focused.value = {};
	}

	function join() {
		if (
			(active && active.value === false) ||
			!connected.value ||
			roomId.value ||
			joining.value ||
			!collection.value ||
			item.value === '+'
		)
			return;

		joining.value = true;

		sdk.sendMessage({
			type: WS_TYPE.COLLAB,
			action: ACTION.CLIENT.JOIN,
			collection: collection.value,
			item: item.value ? String(item.value) : null,
			version: version.value?.key ?? null,
			initialChanges: edits.value,
		});
	}

	function leave() {
		if (!roomId.value) return;

		sendMessage({
			action: ACTION.CLIENT.LEAVE,
		});

		roomId.value = null;
		connectionId.value = null;
	}

	eventHandlers.push(
		sdk.onWebSocket('message', async (message: ServerMessage | ServerError) => {
			if (message.type !== 'collab') return;

			if (
				message.action === ACTION.SERVER.INIT &&
				message.collection === collection.value &&
				((!item.value && !message.item) || message.item === String(item.value)) &&
				((!version.value && !message.version) || message.version === version.value?.key)
			) {
				receiveInit(message);
				return;
			}

			if (message.action === ACTION.SERVER.ERROR) return;
			if (message) if (!roomId.value || roomId.value !== message.room) return;

			messageReceivers[`receive${capitalize(message.action)}`](message as any);
		}),
	);

	const collabContext = {
		update,
		focusedFields: Object.values(focused.value),
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
		joining.value = false;
		roomId.value = message.room;
		connectionId.value = message.connection;

		if (!isEqual(message.changes, edits.value)) {
			if (!isEmpty(edits.value)) collidingLocalChanges.value = edits.value;
			edits.value = message.changes;
		}

		if (message.users.length === 0) return;

		const usersInfo = await sdk.request(
			readUsers({
				filter: {
					id: {
						_in: Array.from(new Set(message.users.map((user) => user.user))),
					},
				},
				fields: ['id', 'first_name', 'last_name', 'avatar.id', 'avatar.modified_on'] as any,
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
		if (message.order > largestUpdateOrder) {
			largestUpdateOrder = message.order;
		} else {
			return;
		}

		if ('changes' in message) {
			if (!isEqual(message.changes, edits.value[message.field])) edits.value[message.field] = message.changes;
		} else {
			delete edits.value[message.field];
		}
	}

	async function receiveDelete() {
		notificationsStore.add({
			title: t('item_deleted'),
			persist: true,
		});

		router.push(`/content/${item.value ? collection.value : ''}`);
	}

	async function receiveJoin(message: JoinMessage) {
		const existingInfo = users.value.find((user) => user.id === message.user);

		const user = existingInfo
			? existingInfo
			: await sdk
					.request<CollabUser>(
						readUser(message.user, {
							fields: ['id', 'first_name', 'last_name', 'avatar.id', 'avatar.modified_on'] as any,
						}),
					)
					.catch(() => ({}));

		users.value = [...users.value, { ...user, id: message.user, color: message.color, connection: message.connection }];
	}

	async function receiveLeave(message: LeaveMessage) {
		users.value = users.value.filter((user) => user.connection !== message.connection);

		delete focused.value[message.connection];

		if (message.connection === connectionId.value) {
			joining.value = false;
			roomId.value = null;
			connectionId.value = null;
			focused.value = {};
			users.value = [];

			setTimeout(join, Math.random() * 1000 + 500);
		}
	}

	async function receiveSave() {
		await getItem();

		if (!initialValues.value) return;

		for (const field of Object.keys(initialValues.value)) {
			if (isEqual(initialValues.value[field], edits.value[field])) delete edits.value[field];
		}

		// Prevent duplicate messages on sender side, kinda hacky
		if (!notificationsStore.queue.some((notify) => notify.title === t('item_update_success')))
			notificationsStore.add({
				title: t('item_update_success'),
			});
	}

	async function receiveDiscard() {
		edits.value = {};
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
			action: ACTION.CLIENT.UPDATE,
			changes: value,
			field: field,
		});
	}, 100);

	const onFieldUnset = throttle((field: string) => {
		sendMessage({
			action: ACTION.CLIENT.UPDATE,
			field: field,
		});
	}, 100);

	function update(changes: Item) {
		edits.value = Object.assign({}, edits.value, changes);

		sendMessage({
			action: ACTION.CLIENT.UPDATE_ALL,
			changes,
		});
	}

	function clearCollidingChanges() {
		collidingLocalChanges.value = undefined;
	}

	const onFocus = debounce((field: string | null) => {
		if (field && Object.values(focused.value).includes(field)) return;

		sendMessage({
			action: ACTION.CLIENT.FOCUS,
			field: field,
		});
	}, 100);

	function discard() {
		sendMessage({
			action: ACTION.CLIENT.DISCARD,
		});

		edits.value = {};
	}

	function sendMessage(message: Omit<ClientMessage, 'id'>) {
		if (!connected.value || !roomId.value) return;

		sdk.sendMessage({
			...message,
			type: WS_TYPE.COLLAB,
			room: roomId.value,
		});
	}

	return { update, users, collabContext, connected, collabCollision, clearCollidingChanges, discard };
}
