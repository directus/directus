import api from '@/api';
import { userName } from '@/utils/user-name';
import { getWebSocket } from '@/websocket';
import { WebSocketClient } from '@directus/shared/types';
import { onMounted, onUnmounted, ref, Ref, computed } from 'vue';

function onReady(callback: (client: WebSocketClient) => void) {
	onMounted(() => {
		const ws = getWebSocket();
		ws.onConnect(callback);
	});
}

export function useCollaboration(collection: Ref<string>, item: Ref<string | null>) {
	const focus = ref<Record<string, string | false>>({});
	const userNames = ref<Record<string, string>>({});
	const userAvatars = ref<Record<string, string>>({});

	const notice = computed<string | false>(() => {
		const users = Object.keys(focus.value);
		if (users.length > 0) {
			if (users.every((u) => !!userNames.value[u])) {
				return users.length === 1
					? `${userNames.value[users[0]]} is editing this page!`
					: `${users.map((u) => userNames.value[u]).join(', ')} are currently editing this page!`;
			} else {
				return users.length === 1
					? `Another person is editing this page!`
					: `${users.length} users are editing this page`;
			}
		}
		return false;
	});

	let _client: WebSocketClient | null = null,
		_abort: (() => void) | null = null;
	onReady((client) => {
		_client = client;
		_abort = client.listen((msg: Record<string, any>) => {
			if (msg.type !== 'FOCUS') return;
			focus.value = msg.collaborators ? msg.collaborators : {};
			loadUserNames();
		});

		client.send(
			'FOCUS',
			{
				collection: collection.value,
				item: item.value,
				field: false,
			},
			false
		);
	});
	onUnmounted(() => {
		_client?.send('BLUR', {}, false);
		typeof _abort === 'function' && _abort();
	});

	return { notice, focus, userNames, userAvatars, sendFocus };

	async function loadUserNames() {
		const ids = Object.keys(focus.value);
		for (const id of ids) {
			if (id in userNames.value) continue;
			const response = await api.get('/users/' + id, {
				params: { fields: ['first_name', 'last_name', 'email', 'avatar'] },
			});
			userNames.value[id] = userName(response.data.data);
			userAvatars.value[id] = response.data.data.avatar;
		}
	}
	function sendFocus(field: string | false) {
		if (_client) {
			_client.send(
				'FOCUS',
				{
					collection: collection.value,
					item: item.value,
					field,
				},
				false
			);
		}
	}
}
