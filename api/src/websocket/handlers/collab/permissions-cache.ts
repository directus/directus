import type { Accountability } from '@directus/types';
import { useBus } from '../../../bus/index.js';

type CacheKey = string; // user:collection:item:action
type Tag = string;

/**
 * Caches permission check results for collaboration clients.
 * Supports granular invalidation based on collection, item, and relational dependencies.
 */
export class PermissionCache {
	private cache = new Map<CacheKey, string[]>();
	private tags = new Map<Tag, Set<CacheKey>>();
	private keyTags = new Map<CacheKey, Set<Tag>>();
	private timers = new Map<CacheKey, NodeJS.Timeout>();
	private bus = useBus();
	private invalidationCount = 0;

	constructor() {
		this.bus.subscribe('websocket.event', (event: any) => {
			this.handleInvalidation(event);
		});
	}

	public getInvalidationCount() {
		return this.invalidationCount;
	}

	private handleInvalidation(event: any) {
		const { collection, keys, key } = event;
		const affectedKeys = new Set<CacheKey>();

		// System Invalidation (Roles, Permissions, Policies, Schema)
		if (
			[
				'directus_roles',
				'directus_permissions',
				'directus_policies',
				'directus_access',
				'directus_fields',
				'directus_relations',
				'directus_collections',
			].includes(collection)
		) {
			this.clear();
			return;
		}

		this.invalidationCount++;

		// Collection-level Invalidation
		if (this.tags.has(`collection:${collection}`)) {
			for (const k of this.tags.get(`collection:${collection}`)!) affectedKeys.add(k);
		}

		// Item-level Invalidation
		const items = keys || (key ? [key] : []);

		for (const id of items) {
			const tag = `item:${collection}:${id}`;

			if (this.tags.has(tag)) {
				for (const k of this.tags.get(tag)!) affectedKeys.add(k);
			}
		}

		// Dependency Invalidation (Items + Relational)
		const depTags = [`dependency:${collection}`];

		for (const id of items) {
			depTags.push(`dependency:${collection}:${id}`);
		}

		for (const tag of depTags) {
			if (this.tags.has(tag)) {
				for (const k of this.tags.get(tag)!) affectedKeys.add(k);
			}
		}

		for (const k of affectedKeys) {
			this.invalidateKey(k);
		}
	}

	/**
	 * Get cached allowed fields for a given accountability and collection/item.
	 */
	get(accountability: Accountability, collection: string, item: string | null, action: string): string[] | undefined {
		const key = this.getCacheKey(accountability, collection, item, action);
		return this.cache.get(key);
	}

	/**
	 * Store allowed fields in the cache with optional TTL and dependencies.
	 */
	set(
		accountability: Accountability,
		collection: string,
		item: string | null,
		action: string,
		fields: string[],
		dependencies: string[] = [],
		ttlMs?: number,
	) {
		const key = this.getCacheKey(accountability, collection, item, action);

		// Clear existing timer if any
		if (this.timers.has(key)) {
			clearTimeout(this.timers.get(key));
			this.timers.delete(key);
		}

		this.cache.set(key, fields);

		if (ttlMs) {
			const timer = setTimeout(() => {
				this.invalidateKey(key);
			}, ttlMs);

			this.timers.set(key, timer);
		}

		// Always tag the specific item
		this.addTag(key, `item:${collection}:${item}`);

		// Always tag the collection to cover batch updates
		this.addTag(key, `collection:${collection}`);

		// Add custom dependencies such as relational collections
		for (const dep of dependencies) {
			this.addTag(key, `dependency:${dep}`);
		}
	}

	private addTag(key: CacheKey, tag: Tag) {
		if (!this.tags.has(tag)) {
			this.tags.set(tag, new Set());
		}

		this.tags.get(tag)!.add(key);

		if (!this.keyTags.has(key)) {
			this.keyTags.set(key, new Set());
		}

		this.keyTags.get(key)!.add(tag);
	}

	private invalidateKey(key: CacheKey) {
		if (this.timers.has(key)) {
			clearTimeout(this.timers.get(key));
			this.timers.delete(key);
		}

		this.cache.delete(key);

		const tags = this.keyTags.get(key);

		if (tags) {
			for (const tag of tags) {
				const keys = this.tags.get(tag);

				if (keys) {
					keys.delete(key);
					if (keys.size === 0) this.tags.delete(tag);
				}
			}

			this.keyTags.delete(key);
		}
	}

	private getCacheKey(
		accountability: Accountability,
		collection: string,
		item: string | null,
		action: string,
	): CacheKey {
		return `${accountability.user || 'public'}:${collection}:${item || 'singleton'}:${action}`;
	}

	/**
	 * Clear the entire cache.
	 */
	clear() {
		for (const timer of this.timers.values()) {
			clearTimeout(timer);
		}

		this.timers.clear();
		this.cache.clear();
		this.tags.clear();
		this.keyTags.clear();
		this.invalidationCount++;
	}
}

export const permissionCache = new PermissionCache();
