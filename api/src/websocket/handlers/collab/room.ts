import { WS_TYPE, type Accountability, type ActionHandler, type Item, type WebSocketClient } from '@directus/types';
import { ACTION, COLORS, type BaseServerMessage, type ClientID, type Color } from '@directus/types/collab';
import { createHash } from 'crypto';
import { isEqual, random } from 'lodash-es';
import getDatabase from '../../../database/index.js';
import emitter from '../../../emitter.js';
import { useLogger } from '../../../logger/index.js';
import { fetchPermissions } from '../../../permissions/lib/fetch-permissions.js';
import { fetchPolicies } from '../../../permissions/lib/fetch-policies.js';
import { extractRequiredDynamicVariableContextForPermissions } from '../../../permissions/utils/extract-required-dynamic-variable-context.js';
import { fetchDynamicVariableData } from '../../../permissions/utils/fetch-dynamic-variable-data.js';
import { processPermissions } from '../../../permissions/utils/process-permissions.js';
import { getSchema } from '../../../utils/get-schema.js';
import { getService } from '../../../utils/get-service.js';
// import { calculateAllowedFields } from './calculate-allowed-fields.js';
import { calculateCacheMetadata } from './calculate-cache-metadata.js';
import { Messenger } from './messenger.js';
import { permissionCache } from './permissions-cache.js';
import { sanitizePayload } from './sanitize-payload.js';
import { useStore } from './store.js';
import { filterToFields } from './filter-to-fields.js';
import { validateItemAccess } from '../../../permissions/modules/validate-access/lib/validate-item-access.js';

/**
 * Store and manage all active collaboration rooms
 */
export class CollabRooms {
	rooms: Record<string, Room> = {};
	messenger: Messenger;

	constructor(messenger: Messenger = new Messenger()) {
		this.messenger = messenger;
	}

	/**
	 * Create a new collaboration room
	 */
	async createRoom(collection: string, item: string | null, version: string | null, initialChanges?: Item) {
		const uid = getRoomHash(collection, item, version);

		if (!(uid in this.rooms)) {
			this.rooms[uid] = new Room(uid, collection, item, version, initialChanges, this.messenger);
		}

		this.messenger.setRoomListener(uid, (message) => {
			if (message.action === 'close') {
				delete this.rooms[uid];
			}
		});

		return this.rooms[uid]!;
	}

	/**
	 * Get an existing room by UID
	 */
	async getRoom(uid: string) {
		let room = this.rooms[uid];

		if (!room) {
			const store = useStore<RoomData>(uid);

			// Loads room from shared memory
			room = await store(async (store) => {
				if (!(await store.has('uid'))) return;

				const collection = await store.get('collection');
				const item = await store.get('item');
				const version = await store.get('version');
				const changes = await store.get('changes');

				return new Room(uid, collection, item, version, changes, this.messenger);
			});
		}

		return room;
	}

	/**
	 * Get all rooms a client is currently in
	 */
	async getClientRooms(client: WebSocketClient) {
		const rooms = [];

		for (const room of Object.values(this.rooms)) {
			if (await room.hasClient(client.uid)) {
				rooms.push(room);
			}
		}

		return rooms;
	}

	/**
	 * Remove empty rooms
	 */
	async cleanupRooms() {
		for (const room of Object.values(this.rooms)) {
			const clients = await room.getClients();

			if (clients.length === 0) {
				await room.close();
				delete this.rooms[room.uid];
			}
		}
	}
}

type RoomData = {
	uid: string;
	collection: string;
	item: string | null;
	version: string | null;
	changes: Item;
	clients: { uid: ClientID; accountability: Accountability }[];
	clientColors: Record<ClientID, Color>;
	focuses: Record<ClientID, string>;
};

type PermissionClient = Pick<WebSocketClient, 'uid' | 'accountability'>;

/**
 * Represents a single collaboration room for a specific item
 */
export class Room {
	uid: string;
	collection: string;
	item: string | null;
	messenger: Messenger;
	store;
	ready: Promise<void>;
	onUpdateHandler: ActionHandler;

	constructor(
		uid: string,
		collection: string,
		item: string | null,
		version: string | null,
		initialChanges?: Item,
		messenger: Messenger = new Messenger(),
	) {
		this.store = useStore<RoomData>(uid);

		this.ready = this.store(async (store) => {
			if (await store.has('uid')) return;

			await store.set('uid', uid);
			await store.set('collection', collection);
			await store.set('item', item);
			await store.set('version', version);
			await store.set('changes', initialChanges ?? {});

			// Default all other values
			await store.set('clientColors', {});
			await store.set('clients', []);
			await store.set('focuses', {});
		});

		this.uid = uid;
		this.collection = collection;
		this.item = item;
		this.messenger = messenger;

		this.onUpdateHandler = async (meta, context) => {
			const { keys } = meta as { keys: string[] };
			const { accountability } = context;

			if (!keys.includes(item!)) return;

			const service = getService(collection, { schema: await getSchema() });

			const result = item ? await service.readOne(item) : await service.readSingleton({});

			const clients = await this.store(async (store) => {
				let changes = await store.get('changes');

				changes = Object.fromEntries(Object.entries(changes).filter(([key, value]) => !isEqual(result[key], value)));

				store.set('changes', changes);

				return await store.get('clients');
			});

			for (const client of clients) {
				if (client.accountability?.user === accountability?.user) continue;

				this.send(client.uid, {
					action: ACTION.SERVER.SAVE,
				});
			}
		};

		// React to external updates to the item
		emitter.onAction(`${collection}.items.update`, this.onUpdateHandler);
	}

	async getCollection() {
		await this.ready;

		return await this.store(async (store) => {
			return await store.get('collection');
		});
	}

	async getClients() {
		await this.ready;

		return await this.store(async (store) => {
			return await store.get('clients');
		});
	}

	async hasClient(id: ClientID) {
		await this.ready;

		return await this.store(async (store) => {
			const clients = await store.get('clients');

			return clients.findIndex((c) => c.uid === id) !== -1;
		});
	}

	async getFocusBy(id: ClientID) {
		return await this.store(async (store) => (await store.get('focuses'))[id]);
	}

	/**
	 * Join the room
	 */
	async join(client: WebSocketClient) {
		this.messenger.addClient(client);
		await this.ready;

		let added = false;
		let clientColor: Color | undefined;

		if (!(await this.hasClient(client.uid))) {
			await this.store(async (store) => {
				const clients = await store.get('clients');

				if (clients.findIndex((c) => c.uid === client.uid) === -1) {
					added = true;
					clientColor = COLORS[random(COLORS.length - 1)]!;

					const clientColors = await store.get('clientColors');
					clientColors[client.uid] = clientColor;
					await store.set('clientColors', clientColors);

					clients.push({ uid: client.uid, accountability: client.accountability! });
					await store.set('clients', clients);
				}
			});
		}

		if (added && clientColor) {
			await this.sendExcluding(
				{
					action: ACTION.SERVER.JOIN,
					user: client.accountability!.user!,
					connection: client.uid,
					color: clientColor,
				},
				client.uid,
			);
		}

		const { collection, item, version, clientColors, changes, focuses, clients } = (await this.store(async (store) => {
			return {
				collection: await store.get('collection'),
				item: await store.get('item'),
				version: await store.get('version'),
				clientColors: await store.get('clientColors'),
				changes: await store.get('changes'),
				focuses: await store.get('focuses'),
				clients: await store.get('clients'),
			};
		})) as RoomData;

		const allowedFields = await this.verifyPermissions(client, collection, item);

		this.send(client.uid, {
			action: ACTION.SERVER.INIT,
			collection: collection,
			item: item,
			version: version,
			changes: (await sanitizePayload(
				collection,
				changes as Record<string, unknown>,
				{
					knex: getDatabase(),
					schema: await getSchema(),
					accountability: client.accountability!,
				},
				allowedFields,
			)) as Item,
			focuses: Object.fromEntries(
				Object.entries(focuses).filter(([_, field]) => allowedFields.includes(field) || allowedFields.includes('*')),
			),
			connection: client.uid,
			users: Array.from(clients).map((client) => ({
				user: client.accountability.user!,
				connection: client.uid,
				color: clientColors[client.uid]!,
			})),
		});
	}

	/**
	 * Leave the room
	 */
	async leave(client: PermissionClient) {
		this.messenger.removeClient(client.uid);
		await this.ready;

		if (!(await this.hasClient(client.uid))) return;

		await this.store(async (store) => {
			const clients = await store.get('clients');

			await store.set(
				'clients',
				clients.filter((c) => c.uid !== client.uid),
			);
		});

		this.sendAll({
			action: ACTION.SERVER.LEAVE,
			connection: client.uid,
		});
	}

	/**
	 * Save the room state and clear changes
	 */
	async save(sender: PermissionClient) {
		await this.ready;

		await this.store(async (store) => {
			await store.set('changes', {});
		});

		await this.sendExcluding(
			{
				action: ACTION.SERVER.SAVE,
			},
			sender.uid,
		);
	}

	/**
	 * Propagate an update to other clients
	 */
	async update(sender: WebSocketClient, changes: Record<string, unknown>) {
		await this.ready;

		const { clients, collection, item } = await this.store(async (store) => {
			const existing_changes = await store.get('changes');
			Object.assign(existing_changes, changes);
			await store.set('changes', existing_changes);

			return {
				clients: (await store.get('clients')) || [],
				collection: await store.get('collection'),
				item: await store.get('item'),
			};
		});

		for (const client of clients) {
			if (client.uid === sender.uid) continue;

			const allowedFields = await this.verifyPermissions(client, collection, item);

			const sanitizedChanges = await sanitizePayload(
				collection,
				changes,
				{
					knex: getDatabase(),
					schema: await getSchema(),
					accountability: client.accountability,
				},
				allowedFields,
			);

			for (const field of Object.keys(changes)) {
				if (field in sanitizedChanges) {
					this.send(client.uid, {
						action: ACTION.SERVER.UPDATE,
						field,
						changes: sanitizedChanges[field],
					});
				}
			}
		}
	}

	/**
	 * Propagate an unset to other clients
	 */
	async unset(sender: PermissionClient, field: string) {
		await this.ready;

		const { clients } = await this.store(async (store) => {
			const changes = await store.get('changes');
			delete changes[field];
			await store.set('changes', changes);

			return { clients: await store.get('clients') };
		});

		for (const client of clients) {
			if (client.uid === sender.uid) continue;

			const allowedFields = await this.verifyPermissions(client, this.collection, this.item);

			if (field && !(allowedFields.includes(field) || allowedFields.includes('*'))) continue;

			this.send(client.uid, {
				action: ACTION.SERVER.UPDATE,
				field: field,
			});
		}
	}

	/**
	 * Propagate focus state to other clients
	 */
	async focus(sender: PermissionClient, field: string | null) {
		await this.ready;

		const { clients } = await this.store(async (store) => {
			const focuses = await store.get('focuses');

			if (!field) {
				delete focuses[sender.uid];
			} else {
				focuses[sender.uid] = field;
			}

			await store.set('focuses', focuses);

			return { clients: await store.get('clients') };
		});

		for (const client of clients) {
			if (client.uid === sender.uid) continue;

			const allowedFields = await this.verifyPermissions(client, this.collection, this.item);

			if (field && !(allowedFields.includes(field) || allowedFields.includes('*'))) continue;

			this.send(client.uid, {
				action: ACTION.SERVER.FOCUS,
				connection: sender.uid,
				field,
			});
		}
	}

	async sendAll(message: BaseServerMessage) {
		await this.ready;

		const clients = await this.store(async (store) => {
			return await store.get('clients');
		});

		for (const client of clients) {
			this.messenger.sendClient(client.uid, { ...message, type: WS_TYPE.COLLAB, room: this.uid });
		}
	}

	async sendExcluding(message: BaseServerMessage, exclude: ClientID) {
		await this.ready;

		const clients = await this.store(async (store) => {
			return await store.get('clients');
		});

		for (const client of clients) {
			if (client.uid !== exclude) {
				this.messenger.sendClient(client.uid, { ...message, type: WS_TYPE.COLLAB, room: this.uid });
			}
		}
	}

	send(client: ClientID, message: BaseServerMessage) {
		this.messenger.sendClient(client, { ...message, type: WS_TYPE.COLLAB, room: this.uid });
	}

	/**
	 * Close the room and notify all clients
	 */
	async close() {
		await this.ready;
		this.messenger.sendRoom(this.uid, { action: 'close' });

		emitter.offAction(`${this.collection}.items.update`, this.onUpdateHandler);

		await this.store(async (store) => {
			await store.delete('uid');
		});
	}

	/**
	 * Verify if a client has permissions to perform an action on the item
	 */
	public async verifyPermissions(
		client: PermissionClient,
		collection: string,
		item: string | null,
		action: 'read' | 'update' = 'read',
	) {
		const accountability = client.accountability;

		if (!accountability) return [];
		if (accountability.admin) return ['*'];

		const cached = permissionCache.get(accountability, collection, item, action);
		console.log(`cache ${cached ? 'hit' : 'miss'} c: ${collection}, i: ${item}, a: ${action}, c:${cached}`);
		if (cached) return cached;

		// Prevent caching stale permissions if an invalidation occurs during async steps
		const startInvalidationCount = permissionCache.getInvalidationCount();

		const schema = await getSchema();
		const knex = getDatabase();

		const service = getService(collection, { schema, knex, accountability });

		let itemData: any = null;

		try {
			const policies = await fetchPolicies(accountability, { knex, schema });

			const rawPermissions = await fetchPermissions(
				{ action, collections: [collection], policies, accountability, bypassDynamicVariableProcessing: true },
				{ knex, schema },
			);

			// Resolve dynamic variables used in the permission filters
			const dynamicVariableContext = extractRequiredDynamicVariableContextForPermissions(rawPermissions);

			const permissionsContext = await fetchDynamicVariableData(
				{ accountability, policies, dynamicVariableContext },
				{ knex, schema },
			);

			const processedPermissions = processPermissions({
				permissions: rawPermissions,
				accountability,
				permissionsContext,
			});

			const fieldsToFetch = processedPermissions
				.map((perm) => (perm.permissions ? filterToFields(perm.permissions, collection, schema) : []))
				.flat();

			// Fetch current item data to evaluate any conditional permission filters based on record state
			if (item) {
				itemData = await service.readOne(item, {
					fields: fieldsToFetch,
				});

				if (!itemData) throw new Error('No access');
			} else if (schema.collections[collection]?.singleton) {
				// validateItemAccess requires the PK to check for item rules
				const pkField = schema.collections[collection]!.primary;

				if (pkField) {
					if (Array.from(fieldsToFetch).some((field) => field === '*' || field === pkField) === false) {
						fieldsToFetch.push(pkField);
					}
				}

				itemData = await service.readSingleton({ fields: fieldsToFetch });
			}

			// TODO: Check which approach might be faster better: Checking it JS or DB side
			// const allowedFields = calculateAllowedFields(collection, processedPermissions, itemData, schema);
			let primaryKeys: (string | number)[] = item ? [item] : [];

			if (schema.collections[collection]?.singleton && itemData) {
				const pkField = schema.collections[collection]!.primary;
				const pk = itemData[pkField];

				if (pk) primaryKeys = [pk];
			}

			const validationContext = {
				collection,
				accountability,
				action,
				primaryKeys,
				returnAllowedRootFields: true,
			};

			const allowedFields = (await validateItemAccess(validationContext, { knex, schema })).allowedRootFields || [];

			// Determine TTL and relational dependencies for cache invalidation
			const { ttlMs, dependencies } = calculateCacheMetadata(
				collection,
				itemData,
				rawPermissions,
				schema,
				accountability,
			);

			// Only cache if the state hasn't been invalidated by another operation in the meantime
			if (permissionCache.getInvalidationCount() === startInvalidationCount) {
				permissionCache.set(accountability, collection, item, action, allowedFields, dependencies, ttlMs);
			}

			return allowedFields;
		} catch (err) {
			useLogger().error(
				err,
				`[Collab] Room.verifyPermissions failed for user "${accountability.user}", collection "${collection}", and item "${item}"`,
			);

			return [];
		}
	}
}

export function getRoomHash(collection: string, item: string | number | null, version: string | null) {
	return createHash('sha256').update([collection, item, version].join('-')).digest('hex');
}
