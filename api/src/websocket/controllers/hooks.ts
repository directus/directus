import emitter from '../../emitter.js';
import { getMessenger } from '../../messenger.js';
import type { WebSocketEvent } from '../messages.js';

let actionsRegistered = false;

export function registerWebSocketEvents() {
	if (actionsRegistered) return;
	actionsRegistered = true;

	registerActionHooks([
		'items',
		'activity',
		'collections',
		'dashboards',
		'folders',
		'notifications',
		'operations',
		'panels',
		'permissions',
		'presets',
		'revisions',
		'roles',
		'settings',
		'shares',
		'users',
		'versions',
		'webhooks',
	]);

	registerFieldsHooks();
	registerFilesHooks();
	registerRelationsHooks();
	registerSortHooks();
}

function registerActionHooks(modules: string[]) {
	// register event hooks that can be handled in an uniform manner
	for (const module of modules) {
		registerAction(module + '.create', ({ key, collection, payload = {} }) => ({
			collection,
			action: 'create',
			key,
			payload,
		}));

		registerAction(module + '.update', ({ keys, collection, payload = {} }) => ({
			collection,
			action: 'update',
			keys,
			payload,
		}));

		registerAction(module + '.delete', ({ keys, collection, payload = [] }) => ({
			collection,
			action: 'delete',
			keys,
			payload,
		}));
	}
}

function registerFieldsHooks() {
	// exception for field hooks that don't report `directus_fields` as being the collection
	registerAction('fields.create', ({ key, payload = {} }) => ({
		collection: 'directus_fields',
		action: 'create',
		key,
		payload,
	}));

	registerAction('fields.update', ({ keys, payload = {} }) => ({
		collection: 'directus_fields',
		action: 'update',
		keys,
		payload,
	}));

	registerAction('fields.delete', ({ keys, payload = [] }) => ({
		collection: 'directus_fields',
		action: 'delete',
		keys,
		payload,
	}));
}

function registerFilesHooks() {
	// extra event for file uploads that doubles as create event
	registerAction('files.upload', ({ key, collection, payload = {} }) => ({
		collection,
		action: 'create',
		key,
		payload,
	}));

	registerAction('files.update', ({ keys, collection, payload = {} }) => ({
		collection,
		action: 'update',
		keys,
		payload,
	}));

	registerAction('files.delete', ({ keys, collection, payload = [] }) => ({
		collection,
		action: 'delete',
		keys,
		payload,
	}));
}

function registerRelationsHooks() {
	// exception for relation hooks that don't report `directus_relations` as being the collection
	registerAction('relations.create', ({ key, payload = {} }) => ({
		collection: 'directus_relations',
		action: 'create',
		key,
		payload: { ...payload, key },
	}));

	registerAction('relations.update', ({ keys, payload = {} }) => ({
		collection: 'directus_relations',
		action: 'update',
		keys,
		payload,
	}));

	registerAction('relations.delete', ({ collection, payload = [] }) => ({
		collection: 'directus_relations',
		action: 'delete',
		keys: payload,
		payload: { collection, fields: payload },
	}));
}

function registerSortHooks() {
	registerAction('items.sort', ({ collection, item }) => ({
		collection,
		action: 'update',
		keys: [item],
		payload: {},
	}));
}

/**
 * Wrapper for emitter.onAction to hook into system events
 * @param event The action event to watch
 * @param transform Transformer function
 */
function registerAction(event: string, transform: (args: Record<string, any>) => WebSocketEvent) {
	const messenger = getMessenger();

	emitter.onAction(event, async (data: Record<string, any>) => {
		// push the event through the Redis pub/sub
		messenger.publish('websocket.event', transform(data) as Record<string, any>);
	});
}
