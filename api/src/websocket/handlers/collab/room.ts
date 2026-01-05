import { WS_TYPE, type Accountability, type Item, type WebSocketClient, type ActionHandler } from '@directus/types';
import { ACTION, COLORS, type BaseServerMessage, type ClientID, type Color } from '@directus/types/collab';
import { createHash } from 'crypto';
import { isEqual, random } from 'lodash-es';
import { REGEX_BETWEEN_PARENS } from '@directus/constants';
import { adjustDate } from '@directus/utils';
import getDatabase from '../../../database/index.js';
import emitter from '../../../emitter.js';
import { fetchPermissions } from '../../../permissions/lib/fetch-permissions.js';
import { fetchPolicies } from '../../../permissions/lib/fetch-policies.js';
import { getSchema } from '../../../utils/get-schema.js';
import { getService } from '../../../utils/get-service.js';
import { permissionCache } from './permissions-cache.js';
import { sanitizePayload } from './sanitize-payload.js';
import { Messenger } from './messenger.js';
import { useStore } from './store.js';
import { filterItems } from '../../../utils/filter-items.js';
import { extractRequiredDynamicVariableContextForPermissions } from '../../../permissions/utils/extract-required-dynamic-variable-context.js';
import { fetchDynamicVariableData } from '../../../permissions/utils/fetch-dynamic-variable-data.js';
import { processPermissions } from '../../../permissions/utils/process-permissions.js';

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

interface PermissionClient {
	uid: ClientID;
	accountability: Accountability | null;
	close?: () => void;
	terminate?: () => void;
}

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

		if (!(await this.hasClient(client.uid))) {
			const clientColor = COLORS[random(COLORS.length - 1)]!;

			await this.sendAll({
				action: ACTION.SERVER.JOIN,
				user: client.accountability!.user!,
				connection: client.uid,
				color: clientColor,
			});

			await this.store(async (store) => {
				const clientColors = await store.get('clientColors');
				clientColors[client.uid] = clientColor;
				await store.set('clientColors', clientColors);

				const clients = await store.get('clients');
				clients.push({ uid: client.uid, accountability: client.accountability! });
				await store.set('clients', clients);
			});
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
	async update(sender: PermissionClient, field: string, changes: unknown) {
		await this.ready;

		const { clients } = await this.store(async (store) => {
			const existing_changes = await store.get('changes');
			existing_changes[field] = changes;
			await store.set('changes', existing_changes);

			return { clients: await store.get('clients') };
		});

		for (const client of clients) {
			if (client.uid === sender.uid) continue;

			const allowedFields = await this.verifyPermissions(client, this.collection, this.item);

			const item_sanitized = (await sanitizePayload(
				this.collection,
				{ [field]: changes },
				{
					knex: getDatabase(),
					schema: await getSchema(),
					accountability: client.accountability,
				},
				allowedFields,
			)) as Item;

			if (field in item_sanitized) {
				this.send(client.uid, {
					action: ACTION.SERVER.UPDATE,
					field,
					changes: item_sanitized[field],
				});
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
		if (cached) return cached;

		const startInvalidationCount = permissionCache.getInvalidationCount();

		const schema = await getSchema();
		const knex = getDatabase();

		const service = getService(collection, { schema, knex, accountability });

		const DYNAMIC_VARIABLE_MAP: Record<string, string> = {
			$CURRENT_USER: 'directus_users',
			$CURRENT_ROLE: 'directus_roles',
			$CURRENT_ROLES: 'directus_roles',
			$CURRENT_POLICIES: 'directus_policies',
		};

		let allowedFields: string[] = [];
		let itemData: any = null;

		try {
			if (item) {
				itemData = await service.readOne(item);
				if (!itemData) throw new Error('No access');
			} else if (schema.collections[collection]?.singleton) {
				itemData = await service.readSingleton({});
			}

			const policies = await fetchPolicies(accountability, { knex, schema });

			const rawPermissions = await fetchPermissions(
				{ action, collections: [collection], policies, accountability, bypassDynamicVariableProcessing: true },
				{ knex, schema },
			);

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

			allowedFields = [];
			const itemArray = itemData ? [itemData] : [];

			for (const perm of processedPermissions) {
				const isMatch =
					!perm.permissions ||
					Object.keys(perm.permissions).length === 0 ||
					filterItems(itemArray, perm.permissions).length > 0;

				if (isMatch && perm.fields) {
					allowedFields.push(...perm.fields);
				}
			}

			allowedFields = Array.from(new Set(allowedFields)).filter(
				(field) => field === '*' || field in (schema.collections[collection]?.fields ?? {}),
			);

			// Calculate Logical Expiry and Dependencies
			let ttlMs: number | undefined;
			const dependencies = new Set<string>();

			if (itemData) {
				const now = Date.now();
				let closestExpiry = Infinity;

				const resolvePath = (path: string[], rootCollection: string): string | null => {
					let currentCollection: string | null = rootCollection;

					for (const segment of path) {
						if (!currentCollection) break;

						const relation = schema.relations.find(
							(r) =>
								(r.collection === currentCollection && r.field === segment) ||
								(r.related_collection === currentCollection && r.meta?.one_field === segment),
						);

						if (relation) {
							currentCollection =
								relation.collection === currentCollection
									? (relation.related_collection as string)
									: (relation.collection as string);
						} else {
							currentCollection = null;
						}
					}

					return currentCollection;
				};

				const scan = (val: unknown, fieldKey?: string, currentCollection: string = collection) => {
					if (!val || typeof val !== 'object') return;

					for (const [key, value] of Object.entries(val)) {
						// Parse dynamic variables
						if (typeof value === 'string' && value.startsWith('$')) {
							if (value.startsWith('$NOW')) {
								const field: string = fieldKey || key;
								const dateValue = itemData[field];

								if (dateValue) {
									let ruleDate = new Date();

									if (value.includes('(')) {
										const adjustment = value.match(REGEX_BETWEEN_PARENS)?.[1];
										if (adjustment) ruleDate = adjustDate(ruleDate, adjustment) || ruleDate;
									}

									const adjustmentMs = ruleDate.getTime() - now;
									const expiry = new Date(dateValue).getTime() - adjustmentMs;

									if (expiry > now && expiry < closestExpiry) {
										closestExpiry = expiry;
									}
								}
							} else {
								const parts = value.split('.');
								const rootCollection = DYNAMIC_VARIABLE_MAP[parts[0]!];

								if (rootCollection && parts.length > 1) {
									const targetCollection = resolvePath(parts.slice(1, -1), rootCollection);

									if (targetCollection) {
										if (parts[0] === '$CURRENT_USER' && accountability.user) {
											dependencies.add(`${targetCollection}:${accountability.user}`);
										} else {
											dependencies.add(targetCollection);
										}
									}
								}
							}
						}

						// Parse relational filter dependencies
						let field = key;

						if (key.includes('(') && key.includes(')')) {
							const columnName = key.match(REGEX_BETWEEN_PARENS)?.[1];
							if (columnName) field = columnName;
						}

						if (!field.startsWith('_')) {
							const relation = schema.relations.find(
								(r) =>
									(r.collection === currentCollection && r.field === field) ||
									(r.related_collection === currentCollection && r.meta?.one_field === field),
							);

							let targetCol: string | null = null;

							if (relation) {
								targetCol =
									relation.collection === currentCollection ? relation.related_collection : relation.collection;
							}

							if (targetCol) {
								dependencies.add(targetCol);
								scan(value, undefined, targetCol);
							} else {
								// Not a relation, but might be a nested filter object
								scan(value, field.startsWith('_') ? fieldKey : field, currentCollection);
							}
						} else {
							// Keep scanning filter operators
							scan(value, fieldKey, currentCollection);
						}
					}
				};

				for (const perm of rawPermissions) {
					scan(perm.permissions);
				}

				if (closestExpiry !== Infinity) {
					ttlMs = closestExpiry - now;
					ttlMs = Math.max(1000, Math.min(ttlMs, 3600000));
				}
			}

			if (permissionCache.getInvalidationCount() === startInvalidationCount) {
				permissionCache.set(accountability, collection, item, action, allowedFields, Array.from(dependencies), ttlMs);
			}

			return allowedFields;
		} catch {
			this.leave(client);
			client.close?.();
			client.terminate?.();
			return [];
		}
	}
}

export function getRoomHash(collection: string, item: string | number | null, version: string | null) {
	return createHash('sha256').update([collection, item, version].join('-')).digest('hex');
}
