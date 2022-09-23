import { getCache } from "../cache.js";

export async function clearSystemCache(forced?: boolean): Promise<void> {
	const { systemCache } = getCache();

	// Flush system cache when forced or when system cache lock not set
	if (forced || !(await systemCache.isLocked())) {
		await systemCache.lock();
		await systemCache.clear();
		await systemCache.unlock();
	}
}

export async function clearAllCollections(): Promise<void> {
    const { systemCache } = getCache();
    await systemCache.lock();

    await systemCache.delete('collections');

    await systemCache.unlock();
}

export async function clearCollection(collections: string | string[]): Promise<void> {
    const { systemCache } = getCache();
    await systemCache.lock();

    await systemCache.deleteHashField('collections', collections);

    await systemCache.unlock();
}

export async function clearFields(collection: string | string[]): Promise<void> {
    const { systemCache } = getCache();
    await systemCache.lock();

    const keys = (Array.isArray(collection) ? collection : [collection]).map((collection) => `fields:${collection}`);

    await systemCache.delete(keys);

    await systemCache.unlock();
}

export async function clearField(collection: string, fields: string | string[]): Promise<void> {
    const { systemCache } = getCache();
    await systemCache.lock();

    await systemCache.deleteHashField(`fields:${collection}`, fields);

    await systemCache.unlock();
}

export async function clearAllRelations(): Promise<void> {
    const { systemCache } = getCache();
    await systemCache.lock();

    const collections = await systemCache.getHash('collections');

    if(collections === null) return

    const keys = Object.keys(collections).map((collection: string) => `relations:${collection}`)

    systemCache.delete(keys)

    await systemCache.unlock();
}

export async function clearRelationsForCollection(collections: string | string[]): Promise<void> {
    const { systemCache } = getCache();
    await systemCache.lock();

    const keys = (Array.isArray(collections) ? collections : [collections]).map((collection) => `relations:${collection}`);

    await systemCache.delete(keys);

    await systemCache.unlock();
}


export async function clearRelationsForField(collection: string, fields: string | string[]): Promise<void> {
    const { systemCache } = getCache();
    await systemCache.lock();

    await systemCache.deleteHashField(`relations:${collection}`, fields);

    await systemCache.unlock();
}