import { getCache } from "../cache";

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

export async function clearCollection(collection: string): Promise<void> {
    const { systemCache } = getCache();
    await systemCache.lock();

    await systemCache.deleteHashField('collections', collection);

    await systemCache.unlock();
}

export async function clearFields(collection: string): Promise<void> {
    const { systemCache } = getCache();
    await systemCache.lock();

    await systemCache.delete(`fields:${collection}`);

    await systemCache.unlock();
}

export async function clearField(collection: string, field: string): Promise<void> {
    const { systemCache } = getCache();
    await systemCache.lock();

    await systemCache.deleteHashField(`fields:${collection}`, field);

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

export async function clearRelationsForCollection(collection: string): Promise<void> {
    const { systemCache } = getCache();
    await systemCache.lock();

    await systemCache.delete(`relations:${collection}`);

    await systemCache.unlock();
}


export async function clearRelationsForField(collection: string, field: string): Promise<void> {
    const { systemCache } = getCache();
    await systemCache.lock();

    await systemCache.deleteHashField(`relations:${collection}`, field);

    await systemCache.unlock();
}