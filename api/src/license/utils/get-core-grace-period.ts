import { ItemsService } from "../../services/items.js";
import { getSchema } from "../../utils/get-schema.js";

const V12_MIGRATION_VERSION = '20260507A';

export async function getCoreGracePeriod(): Promise<boolean> {
    const itemsService = new ItemsService('directus_migrations', {
        schema: await getSchema(),
    });

    const [oldest, v12] = await Promise.all([
        itemsService.readByQuery({
            fields: ['timestamp'],
            sort: ['timestamp'],
            limit: 1,
        }).then(r => r[0]),
        itemsService.readByQuery({
            fields: ['timestamp'],
            filter: { version: { _eq: V12_MIGRATION_VERSION } },
            limit: 1,
        }).then(r => r[0]),
    ]);

    if (!oldest || !v12) return false;

    const start = new Date(oldest!['timestamp']).getTime();
    const upgrade = new Date(v12!['timestamp']).getTime();
    const clean_install = 24 * 60 * 60 * 1000; // 1 day
    
    if (upgrade - start < clean_install) return false;

    const grace_period = 30 * 24 * 60 * 60 * 1000; // 30 days

    return Date.now() - upgrade < grace_period;
}