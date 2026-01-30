import { useEnv } from '@directus/env';
import type { Accountability } from '@directus/types';
import { LRUMapWithDelete } from 'mnemonist';
import { useBus } from '../../bus/index.js';
import { IRRELEVANT_COLLECTIONS } from './constants.js';

const env = useEnv();

type CacheKey = string; // user:collection:item:action
type Tag = string;

/**
 * Caches permission check results for collaborative editing clients.
 * Supports granular invalidation based on collection, item, and relational dependencies.
 */
export class PermissionCache {
	private cache: LRUMapWithDelete<CacheKey, string[] | null>;
	private tags = new Map<Tag, Set<CacheKey>>();
	private keyTags = new Map<CacheKey, Set<Tag>>();
	private timers = new Map<CacheKey, NodeJS.Timeout>();
	private bus = useBus();
	private invalidationCount = 0;

	constructor(maxSize: number) {
		this.cache = new LRUMapWithDelete(maxSize);

		this.bus.subscribe('websocket.event', (event: any) => {
			this.handleInvalidation(event);
		});
	}

	/**
	 * Used for race condition protection during async permission fetches.
	 */
	public getInvalidationCount() {
		return this.invalidationCount;
	}

	/**
	 * Clears entire cache for system collections, or performs granular invalidation for user data.
	 */
	private handleInvalidation(event: any) {
		const { collection, keys, key } = event;
		const items = keys || (key ? [key] : []);
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

		// Skip known high-traffic collections
		if (IRRELEVANT_COLLECTIONS.includes(collection)) {
			return;
		}

		this.invalidationCount++;

		// Prevent overflow issues in long-running processes
		if (this.invalidationCount >= Number.MAX_SAFE_INTEGER) {
			this.invalidationCount = 1;
		}

		// Skip if no keys are watching
		if (
			!this.tags.has(`collection:${collection}`) &&
			!this.tags.has(`dependency:${collection}`) &&
			!this.tags.has(`collection-dependency:${collection}`)
		) {
			return;
		}

		// Collection-level Invalidation
		if (items.length === 0 && this.tags.has(`collection:${collection}`)) {
			for (const k of this.tags.get(`collection:${collection}`)!) affectedKeys.add(k);
		}

		// Item-level Invalidation
		for (const id of items) {
			const tag = `item:${collection}:${id}`;

			if (this.tags.has(tag)) {
				for (const k of this.tags.get(tag)!) affectedKeys.add(k);
			}
		}

		// Dependency Invalidation (Items + Relational)
		const depTags = [`dependency:${collection}`];

		if (items.length > 0) {
			for (const id of items) {
				depTags.push(`dependency:${collection}:${id}`);
			}
		} else {
			depTags.push(`collection-dependency:${collection}`);
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
	 * LRUMap automatically updates access order on get().
	 */
	get(
		accountability: Accountability,
		collection: string,
		item: string | null,
		action: string,
	): string[] | null | undefined {
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
		fields: string[] | null,
		dependencies: string[] = [],
		ttlMs?: number,
	) {
		const key = this.getCacheKey(accountability, collection, item, action);

		// Clear existing timer if any
		if (this.timers.has(key)) {
			clearTimeout(this.timers.get(key));
			this.timers.delete(key);
		}

		// Clean up metadata for LRU eviction if at capacity
		// LRUMapWithDelete auto-evicts, but we need to clean up our tag mappings
		if (!this.cache.has(key) && this.cache.size >= this.cache.capacity) {
			const lruKey = this.cache.keys().next().value;

			if (lruKey) {
				this.cleanupKeyMetadata(lruKey);
			}
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

			if (dep.includes(':')) {
				const [dependencyCollection] = dep.split(':');
				this.addTag(key, `collection-dependency:${dependencyCollection}`);
			}
		}
	}

	/**
	 * Called before LRU eviction or explicit invalidation to prevent orphaned metadata.
	 */
	private cleanupKeyMetadata(key: CacheKey) {
		if (this.timers.has(key)) {
			clearTimeout(this.timers.get(key));
			this.timers.delete(key);
		}

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

	/**
	 * Maintains bidirectional mappings: tag → keys and key → tags.
	 */
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

	/**
	 * Cleans up metadata first, then removes from cache.
	 */
	private invalidateKey(key: CacheKey) {
		this.cleanupKeyMetadata(key);
		this.cache.delete(key);
	}

	/**
	 * Cache key format: user:collection:item:action
	 */
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

export const permissionCache = new PermissionCache(
	Number(env['WEBSOCKETS_COLLAB_PERMISSIONS_CACHE_CAPACITY'] ?? 2000),
);
